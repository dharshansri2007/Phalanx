"""
proxy_client.py — Phalanx AI Stage 1 Filter
"""

import re
import base64
import logging
from typing import NamedTuple, Optional, Callable

logger = logging.getLogger("phalanx.proxy")

# Keywords that must appear in decoded base64 content for it to be flagged.
# Real attack payloads contain instructions; image blobs, hashes, and
# tracking IDs do not.
_INJECTION_KEYWORDS = re.compile(
    r"(ignore|disregard|override|forget|you are now|system prompt|"
    r"reveal|exfiltrat|jailbreak|bypass|act as|DAN\b|do anything now)",
    re.I,
)

# Patterns that indicate the surrounding HTML context is a known-safe
# data carrier — not an injected instruction blob.
_SAFE_CONTEXT_PATTERNS = re.compile(
    r"(data:image/|data:font/|data:application/|"
    r"src=['\"]data:|url\(data:|"
    r"integrity=['\"]sha|"          # SRI hashes
    r"nonce=['\"]|"                 # CSP nonces
    r"<script|<style)",             # inline script/style blocks with hashes
    re.I,
)


def _is_real_encoded_payload(candidate: str, context: str = "") -> bool:
    """
    Three-gate check:
    1. Must base64-decode to >85% printable content (eliminates random noise).
    2. Must NOT appear inside a known-safe data carrier context (data URIs,
       SRI hashes, CSP nonces) — these are legitimate and common on any
       modern website.
    3. The decoded content must contain at least one injection keyword —
       otherwise it's just a tracking ID, session token, or image blob.
    """
    # Gate 1: decodeable + printable
    padded = candidate + "=" * (-len(candidate) % 4)
    try:
        decoded_bytes = base64.b64decode(padded, validate=False)
    except Exception:
        return False
    if not decoded_bytes:
        return False
    printable_ratio = sum(32 <= b < 127 or b in (9, 10, 13) for b in decoded_bytes) / len(decoded_bytes)
    if printable_ratio <= 0.85:
        return False

    # Gate 2: safe-context exclusion — look 200 chars before the match
    if context and _SAFE_CONTEXT_PATTERNS.search(context):
        return False

    # Gate 3: decoded text must contain an injection keyword
    try:
        decoded_text = decoded_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return False

    if not _INJECTION_KEYWORDS.search(decoded_text):
        return False

    return True


# Each entry: (label, compiled_pattern, optional_validator)
_PATTERNS: list[tuple[str, re.Pattern, Optional[Callable[[str], bool]]]] = [
    ("DirectOverride",
     re.compile(r"(ignore|disregard|forget|override)\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?)", re.I),
     None),

    ("PersonaHijack",
     re.compile(r"you\s+are\s+now\s+(?:a|an|the)\s+\w+", re.I),
     None),
    ("PersonaHijack",
     re.compile(r"\bDAN\b"),
     None),

    ("SystemLeak",
     re.compile(r"(print|show|reveal|repeat|output)\s+(your\s+)?(system\s+prompt|instructions?|prompt)", re.I),
     None),

    ("Exfiltration",
     re.compile(r"(send|post|exfiltrat|transmit).{0,40}(api[_\s]?key|token|secret|credential)", re.I),
     None),

    # Hidden text + instruction keyword in same region (the real CSS injection attack)
    ("HiddenInstruction",
     re.compile(
         r"font-size\s*:\s*0[^>]{0,200}?"
         r"(ignore|disregard|override|forget|you are now|reveal|exfiltrat|system prompt)",
         re.I | re.DOTALL,
     ),
     None),

    # Base64-encoded payloads — now with context-aware 3-gate validation
    ("EncodedPayload",
     re.compile(r"[A-Za-z0-9+/]{80,}={0,2}"),
     None),  # validator called manually below with context
]

# Separate entry so we can pass context to its validator
_ENCODED_PAYLOAD_PATTERN = re.compile(r"[A-Za-z0-9+/]{80,}={0,2}")


class ProxyResult(NamedTuple):
    is_safe: bool
    reason: str
    stage: str
    pattern_hit: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "is_safe": self.is_safe,
            "reason": self.reason,
            "stage": self.stage,
            "pattern_hit": self.pattern_hit,
        }


class LobsterTrapClient:
    @staticmethod
    def _regex_scan(text: str) -> Optional[ProxyResult]:
        """Compiled regex scan with context-aware base64 validation."""

        # Run all non-base64 patterns first
        for label, pattern, _ in _PATTERNS:
            if label == "EncodedPayload":
                continue  # handled separately below
            match = pattern.search(text)
            if match:
                hit = match.group()[:80]
                logger.warning(f"[Proxy] ❌ REGEX HIT | type={label} | match={hit!r}")
                return ProxyResult(
                    is_safe=False,
                    reason=f"KnownPattern:{label}",
                    stage="LOCAL_REGEX",
                    pattern_hit=hit,
                )

        # Base64 check with context: pass 200-char window before each match
        for match in _ENCODED_PAYLOAD_PATTERN.finditer(text):
            candidate = match.group()
            start = match.start()
            context_window = text[max(0, start - 200): start]
            if _is_real_encoded_payload(candidate, context=context_window):
                hit = candidate[:80]
                logger.warning(f"[Proxy] ❌ REGEX HIT | type=EncodedPayload | match={hit!r}")
                return ProxyResult(
                    is_safe=False,
                    reason="KnownPattern:EncodedPayload",
                    stage="LOCAL_REGEX",
                    pattern_hit=hit,
                )
            else:
                logger.debug(f"[Proxy] Base64 candidate ignored (failed 3-gate check) | len={len(candidate)}")

        return None

    @staticmethod
    async def check_payload(text: str) -> dict:
        """Stage 1 filter. Regex pass — if clean, simulates successful proxy pass."""
        regex_result = LobsterTrapClient._regex_scan(text)
        if regex_result is not None:
            return regex_result.to_dict()

        logger.info(f"[Proxy] Regex clean ({len(text)} chars).")
        logger.info("[Proxy] ✓ Simulated Lobster Trap PASSED (Hackathon Mode).")
        return ProxyResult(is_safe=True, reason="PassedLobsterTrap", stage="LOBSTER_TRAP").to_dict()