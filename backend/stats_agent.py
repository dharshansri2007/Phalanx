"""
stats_agent.py — Phalanx AI | Tier 1.5: Statistical & Information-Theoretic Firewall

WHY THIS EXISTS
───────────────
Every other tier in this pipeline trusts a model to judge whether content is
dangerous: the regex tier trusts a human-written pattern list, the Gemini tier
trusts an LLM's "opinion." But an LLM judge can itself be fooled by the same
prompt-injection techniques it's meant to catch — it is, after all, just
another language model reading untrusted text.

This module trusts nothing but arithmetic. It runs zero AI models. Every
number here comes from a published formula (Shannon 1948, Friedman's Index
of Coincidence, Pearson's chi-squared test) applied to raw character
statistics. It can't be jailbroken, prompt-injected, or talked out of its
answer, because it has no language understanding to manipulate — it just
counts characters and does arithmetic on the counts.

It sits between the regex tier and the Gemini tier: cheap enough to run on
every request (sub-millisecond, no network call), and it doubles as a cost
optimization — payloads that are statistically incoherent get rejected
before you ever spend Gemini tokens evaluating them.

THE FIVE SIGNALS
────────────────
1. Shannon Entropy (global)      — how much "information density" the raw
                                    character stream carries. Encoded/random
                                    payloads carry far more than prose.
2. Shannon Entropy (sliding window) — same idea, but scanned in small windows
                                    so a short obfuscated blob hidden inside
                                    an otherwise normal paragraph can't hide
                                    behind a low *average*.
3. Compression Ratio             — natural language is redundant and
                                    compresses well; encoded/random data
                                    doesn't compress at all.
4. Chi-Squared Letter Frequency  — classic cryptanalysis. Compares the
                                    sample's a-z letter distribution against
                                    the known real-world English frequency
                                    table. Ciphertext and encoded data don't
                                    follow it; English does.
5. Index of Coincidence          — a second, independent cryptanalytic
                                    measure of how "skewed vs. uniform" the
                                    letter distribution is. English text is
                                    skewed (E and T dominate); noise is flat.

A sixth, simpler structural signal (longest unbroken non-whitespace run) is
folded in too — encoded blobs and smuggled payloads are very often one
giant token with no spaces, which is unusual in ordinary prose.

NONE of these thresholds are physical constants. The underlying formulas
(entropy, chi-squared, IC) are mathematically exact. The *cutoff values*
below are empirically calibrated baselines for English prose vs. encoded
data, and are exposed as class constants specifically so they can be tuned
against your own traffic if you see false positives/negatives in practice.
"""

import math
import re
import zlib
import logging
from collections import Counter
from typing import NamedTuple, Optional

logger = logging.getLogger("phalanx.stats")

# ─────────────────────────────────────────
# REFERENCE DISTRIBUTIONS (published, not invented)
# ─────────────────────────────────────────

# Standard English letter frequency table, percent of all letters (a-z),
# widely reproduced in cryptography literature (Lewand, "Cryptological
# Mathematics", 2000; consistent with Cornell/CMU cryptanalysis references).
# Sums to 100.000.
ENGLISH_LETTER_FREQ_PCT = {
    "a": 8.167, "b": 1.492, "c": 2.782, "d": 4.253, "e": 12.702,
    "f": 2.228, "g": 2.015, "h": 6.094, "i": 6.966, "j": 0.153,
    "k": 0.772, "l": 4.025, "m": 2.406, "n": 6.749, "o": 7.507,
    "p": 1.929, "q": 0.095, "r": 5.987, "s": 6.327, "t": 9.056,
    "u": 2.758, "v": 0.978, "w": 2.360, "x": 0.150, "y": 1.974,
    "z": 0.074,
}

# Index of Coincidence for natural English text, the long-standing reference
# value from classical cryptanalysis (Friedman). Random text uniformly
# distributed over 26 letters has IC = 1/26 ≈ 0.0385 — English sits well
# above that because letter usage is skewed (E, T, A dominate).
ENGLISH_IC_REFERENCE = 0.0667
RANDOM_IC_REFERENCE = 1.0 / 26.0  # ≈ 0.0385

# Chi-squared critical values for 25 degrees of freedom (26 letters - 1),
# from standard chi-squared distribution tables.
CHI_SQUARED_DF25_P05 = 37.65   # p = 0.05  — "starting to look unusual"
CHI_SQUARED_DF25_P001 = 52.62  # p = 0.001 — "statistically not English"


class StatisticalAnalysis(NamedTuple):
    is_safe: bool
    risk_score: float          # 0.0 (looks like prose) .. 1.0 (looks encoded/random)
    reason: str
    stage: str
    metrics: dict               # full breakdown, for logging / dashboards
    confidence: str              # "low" | "normal" — low for very short samples

    def to_dict(self) -> dict:
        return {
            "is_safe": self.is_safe,
            "risk_score": self.risk_score,
            "reason": self.reason,
            "stage": self.stage,
            "metrics": self.metrics,
            "confidence": self.confidence,
        }


class StatisticalAgent:
    """
    Tier 1.5 — pure-math anomaly detector. No model calls, no network I/O.
    """

    # ── Calibration constants ───────────────────────────────────────────
    # Minimum sample size below which letter-frequency statistics (chi-sq,
    # IC) are too noisy to trust. Below this we skip those two checks
    # rather than risk a false positive on a short, perfectly normal string.
    _MIN_LETTERS_FOR_FREQ_TESTS = 60

    # Below this many total characters, we don't run the analysis with full
    # confidence at all (a two-word query has no meaningful "statistics").
    _MIN_CHARS_FOR_FULL_CONFIDENCE = 40

    # Global Shannon entropy (bits/char). English prose using the full
    # printable ASCII range (letters + digits + punctuation + spaces)
    # typically lands ~3.8–4.8 bits/char. Base64 approaches its theoretical
    # ceiling of log2(64) = 6.0 bits/char; raw random bytes approach ~7.5–8.
    _ENTROPY_SAFE_MAX = 5.0
    _ENTROPY_CRITICAL = 5.8

    # Same scale, applied to the highest-entropy window found by the
    # sliding scan. Small windows are noisier estimators, so this is
    # intentionally a little more lenient than the global thresholds.
    _WINDOW_ENTROPY_SAFE_MAX = 5.3
    _WINDOW_ENTROPY_CRITICAL = 6.1
    _WINDOW_SIZE = 48
    _WINDOW_STRIDE = 24

    # zlib compression ratio = len(compressed) / len(original). English
    # prose typically compresses to ~0.35–0.55 of its original size.
    # Encoded/random data barely compresses, ratio approaches or exceeds 1.0.
    _COMPRESSION_SAFE_MAX = 0.65
    _COMPRESSION_CRITICAL = 0.92

    # Chi-squared deviation from the English letter-frequency table.
    _CHI_SQUARED_SAFE_MAX = CHI_SQUARED_DF25_P05
    _CHI_SQUARED_CRITICAL = CHI_SQUARED_DF25_P001

    # Index of Coincidence. Below this, the letter distribution is
    # statistically closer to uniform/random than to English.
    _IC_SAFE_MIN = 0.058
    _IC_CRITICAL_LOW = 0.045

    # Longest run of non-whitespace characters (one giant "token"). Most
    # natural words/URLs/model numbers are well under this; encoded blobs
    # smuggled into otherwise normal text often are not.
    _LONGEST_TOKEN_SAFE_MAX = 90
    _LONGEST_TOKEN_CRITICAL = 220

    # Weighted blend — must sum to 1.0. Entropy and compression get the
    # largest weight because they're the most general-purpose detectors;
    # chi-squared/IC are powerful but only apply to alphabetic content and
    # need a longer sample, so they're weighted lower and skipped on short
    # inputs rather than forced.
    _WEIGHTS = {
        "entropy": 0.25,
        "window_entropy": 0.20,
        "compression": 0.20,
        "chi_squared": 0.15,
        "index_of_coincidence": 0.10,
        "longest_token": 0.10,
    }

    _RISK_THRESHOLD = 0.55  # consistent with SecurityAgent's threshold

    # ── Core formulas ────────────────────────────────────────────────────

    @staticmethod
    def _shannon_entropy(sample: str) -> float:
        """H(X) = -Σ p(x_i) · log2(p(x_i)) over the character distribution."""
        if not sample:
            return 0.0
        counts = Counter(sample)
        n = len(sample)
        return -sum((c / n) * math.log2(c / n) for c in counts.values())

    @staticmethod
    def _max_window_entropy(sample: str, window: int, stride: int) -> float:
        """Slide a fixed-size window across the text and return the highest
        entropy seen in any single window — catches a localized obfuscated
        blob that a single global average would dilute and hide."""
        if len(sample) <= window:
            return StatisticalAgent._shannon_entropy(sample)
        best = 0.0
        for start in range(0, len(sample) - window + 1, stride):
            chunk = sample[start:start + window]
            best = max(best, StatisticalAgent._shannon_entropy(chunk))
        return best

    @staticmethod
    def _compression_ratio(sample: str) -> float:
        """len(compressed)/len(original) via zlib. Low ratio = redundant
        (natural language). High ratio = incompressible (encoded/random)."""
        data = sample.encode("utf-8", errors="ignore")
        if len(data) < 16:
            return 0.0  # too short to be a meaningful compression sample
        compressed = zlib.compress(data, level=9)
        return len(compressed) / len(data)

    @staticmethod
    def _chi_squared_letter_freq(sample: str) -> Optional[float]:
        """Pearson's chi-squared goodness-of-fit test against the known
        English letter-frequency distribution. χ² = Σ (O-E)²/E."""
        letters = [c for c in sample.lower() if "a" <= c <= "z"]
        n = len(letters)
        if n < StatisticalAgent._MIN_LETTERS_FOR_FREQ_TESTS:
            return None  # not enough signal to trust the statistic
        observed = Counter(letters)
        chi_sq = 0.0
        for letter, pct in ENGLISH_LETTER_FREQ_PCT.items():
            expected = (pct / 100.0) * n
            obs = observed.get(letter, 0)
            chi_sq += ((obs - expected) ** 2) / expected
        return chi_sq

    @staticmethod
    def _index_of_coincidence(sample: str) -> Optional[float]:
        """IC = Σ n_i(n_i-1) / (N(N-1)). Friedman's classical cryptanalytic
        measure of how skewed (English) vs. uniform (random) a letter
        distribution is."""
        letters = [c for c in sample.lower() if "a" <= c <= "z"]
        n = len(letters)
        if n < StatisticalAgent._MIN_LETTERS_FOR_FREQ_TESTS:
            return None
        counts = Counter(letters)
        numerator = sum(c * (c - 1) for c in counts.values())
        denominator = n * (n - 1)
        return numerator / denominator if denominator else 0.0

    @staticmethod
    def _longest_token(sample: str) -> int:
        """Longest unbroken run of non-whitespace characters."""
        tokens = sample.split()
        return max((len(t) for t in tokens), default=0)

    # ── Normalization helper ────────────────────────────────────────────

    @staticmethod
    def _normalize(value: float, safe_max: float, critical: float) -> float:
        """Linearly scale a raw metric into a 0.0–1.0 sub-risk score.
        At or below `safe_max` → 0.0. At or above `critical` → 1.0.
        Linear interpolation in between."""
        if value <= safe_max:
            return 0.0
        if value >= critical:
            return 1.0
        return (value - safe_max) / (critical - safe_max)

    @staticmethod
    def _normalize_inverted(value: float, safe_min: float, critical_low: float) -> float:
        """Same as _normalize but for metrics where LOWER is riskier
        (e.g. Index of Coincidence — natural language is HIGH IC)."""
        if value >= safe_min:
            return 0.0
        if value <= critical_low:
            return 1.0
        return (safe_min - value) / (safe_min - critical_low)

    # ── Public entrypoint ────────────────────────────────────────────────

    @staticmethod
    async def execute(text: str) -> dict:
        """
        Pure-math anomaly scan. No model calls, no network I/O — this is
        synchronous arithmetic wrapped in `async` purely so it slots into
        the same pipeline calling convention as the other tiers. For the
        ~8,000-character inputs this pipeline caps at, the full scan runs
        in well under a millisecond, so it never blocks the event loop in
        any way that matters.
        """
        if not text or not text.strip():
            return StatisticalAnalysis(
                is_safe=True, risk_score=0.0, reason="EmptyInput",
                stage="STATISTICAL_TIER", metrics={}, confidence="low",
            ).to_dict()

        sample = text.strip()
        n_chars = len(sample)

        entropy = StatisticalAgent._shannon_entropy(sample)
        window_entropy = StatisticalAgent._max_window_entropy(
            sample, StatisticalAgent._WINDOW_SIZE, StatisticalAgent._WINDOW_STRIDE
        )
        compression = StatisticalAgent._compression_ratio(sample)
        chi_sq = StatisticalAgent._chi_squared_letter_freq(sample)
        ic = StatisticalAgent._index_of_coincidence(sample)
        longest_token = StatisticalAgent._longest_token(sample)

        sub_scores = {
            "entropy": StatisticalAgent._normalize(
                entropy, StatisticalAgent._ENTROPY_SAFE_MAX, StatisticalAgent._ENTROPY_CRITICAL
            ),
            "window_entropy": StatisticalAgent._normalize(
                window_entropy, StatisticalAgent._WINDOW_ENTROPY_SAFE_MAX, StatisticalAgent._WINDOW_ENTROPY_CRITICAL
            ),
            "compression": StatisticalAgent._normalize(
                compression, StatisticalAgent._COMPRESSION_SAFE_MAX, StatisticalAgent._COMPRESSION_CRITICAL
            ),
            "longest_token": StatisticalAgent._normalize(
                longest_token, StatisticalAgent._LONGEST_TOKEN_SAFE_MAX, StatisticalAgent._LONGEST_TOKEN_CRITICAL
            ),
        }

        # Letter-frequency tests only contribute if we had enough letters
        # to trust them — otherwise their weight is redistributed across
        # the remaining signals so a short sample isn't unfairly diluted
        # towards "safe" just because two checks abstained.
        active_weights = dict(StatisticalAgent._WEIGHTS)
        if chi_sq is not None:
            sub_scores["chi_squared"] = StatisticalAgent._normalize(
                chi_sq, StatisticalAgent._CHI_SQUARED_SAFE_MAX, StatisticalAgent._CHI_SQUARED_CRITICAL
            )
        else:
            active_weights.pop("chi_squared")

        if ic is not None:
            sub_scores["index_of_coincidence"] = StatisticalAgent._normalize_inverted(
                ic, StatisticalAgent._IC_SAFE_MIN, StatisticalAgent._IC_CRITICAL_LOW
            )
        else:
            active_weights.pop("index_of_coincidence")

        weight_total = sum(active_weights.values())
        risk_score = sum(
            sub_scores[k] * (active_weights[k] / weight_total) for k in active_weights
        )
        risk_score = round(min(1.0, max(0.0, risk_score)), 4)

        confidence = "normal" if n_chars >= StatisticalAgent._MIN_CHARS_FOR_FULL_CONFIDENCE else "low"
        is_safe = risk_score < StatisticalAgent._RISK_THRESHOLD

        # Build a human-readable reason naming whichever signals actually
        # drove the score, instead of just a bare number.
        triggered = [k for k, v in sub_scores.items() if v >= 0.5]
        reason = "StatisticallyNormal" if is_safe else f"StatisticalAnomaly:{'+'.join(triggered) or 'CompositeScore'}"

        metrics = {
            "entropy_bits_per_char": round(entropy, 3),
            "max_window_entropy": round(window_entropy, 3),
            "compression_ratio": round(compression, 3),
            "chi_squared": round(chi_sq, 2) if chi_sq is not None else None,
            "index_of_coincidence": round(ic, 4) if ic is not None else None,
            "longest_token_chars": longest_token,
            "sample_length": n_chars,
            "sub_scores": {k: round(v, 3) for k, v in sub_scores.items()},
        }

        if not is_safe:
            logger.warning(f"[Stats] ❌ ANOMALY | risk={risk_score} | {reason} | {metrics}")
        else:
            logger.info(f"[Stats] ✓ CLEAR | risk={risk_score} | confidence={confidence}")

        return StatisticalAnalysis(
            is_safe=is_safe, risk_score=risk_score, reason=reason,
            stage="STATISTICAL_TIER", metrics=metrics, confidence=confidence,
        ).to_dict()