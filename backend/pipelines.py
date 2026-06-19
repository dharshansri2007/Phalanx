"""
pipelines.py — Phalanx AI
"""

import logging
import time
from datetime import datetime, timezone
from typing import Optional

from agents import (
    IngestionAgent, SecurityAgent, CompactorAgent,
    QuarantineTriggered, PipelineError,
)
from proxy_client import LobsterTrapClient
from stats_agent import StatisticalAgent
from schemas import PipelineResponse, SafetyEvaluation, CompactedSummary

logger = logging.getLogger("phalanx.pipeline")


class PhalanxPipeline:

    @staticmethod
    async def run(query: str, raw_payload_override: Optional[str] = None) -> PipelineResponse:
        start = time.perf_counter()
        safety_eval: Optional[SafetyEvaluation] = None
        compacted:   Optional[CompactedSummary]  = None
        source_url:  Optional[str] = None

        try:
            # ── STAGE 1: Ingestion ────────────────────────────────────────────
            if raw_payload_override is not None and raw_payload_override.strip():
                # Demo override — skips live SERP + page fetch entirely.
                # Network-independent and instant. This is how you demo a
                # crafted attack getting caught without depending on a real
                # website being reachable in front of judges.
                logger.info(f"[Pipeline] START | MANUAL_OVERRIDE | {len(raw_payload_override)} chars")
                raw_payload = raw_payload_override
                source_url = "MANUAL_OVERRIDE"
            else:
                logger.info(f"[Pipeline] START | query={query!r}")
                ingestion = await IngestionAgent.execute(query)
                raw_payload = ingestion["raw_html"]
                source_url  = ingestion["source_url"]

                if ingestion["fallback_used"]:
                    logger.warning(
                        f"[Pipeline] ⚠ Page fetch failed for all candidates — "
                        f"firewall is inspecting SERP snippets, not raw HTML."
                    )

            # ── STAGE 1.5: Tier-1 Local Proxy Filter ─────────────────────────
            # Now scanning real HTML — hidden CSS, comments, script tags, the
            # actual attack surface the pitch describes, not a snippet.
            logger.info("[Pipeline] Routing payload through Tier-1 Proxy...")
            proxy_result = await LobsterTrapClient.check_payload(raw_payload)
            if not proxy_result.get("is_safe", False):
                raise QuarantineTriggered(
                    reason=proxy_result.get("reason", "Tier1_ProxyIntercept"),
                    risk_score=1.0,
                )

            # ── STAGE 1.7: Mathematical Statistics Filter ────────────────────
            logger.info("[Pipeline] Running Deterministic Math Analysis...")
            stats_result = await StatisticalAgent.execute(raw_payload)
            if not stats_result.get("is_safe", False):
                raise QuarantineTriggered(
                    reason=stats_result.get("reason", "StatisticalAnomaly"),
                    risk_score=stats_result.get("risk_score", 1.0),
                )

            # ── STAGE 2: Security Evaluation ──────────────────────────────────
            sec_result = await SecurityAgent.execute(raw_payload)
            safety_eval = SafetyEvaluation(
                is_safe=sec_result.get("is_safe", True),
                risk_score=sec_result.get("risk_score", 0.0),
                threat_type=sec_result.get("threat_type"),
                explanation=sec_result.get("explanation"),
            )

            # ── STAGE 3: Compression — strip tags ONLY now, post-clearance ───
            clean_text = IngestionAgent.extract_visible_text(raw_payload)
            summary_text = await CompactorAgent.execute(clean_text)

            compacted = CompactedSummary(
                summary_text=summary_text,
                tokens_used=len(summary_text) // 4,
                generated_at=datetime.now(timezone.utc),
            )

            elapsed = round(time.perf_counter() - start, 3)
            logger.info(f"[Pipeline] ✓ SUCCESS | source={source_url} | {elapsed}s")

            return PipelineResponse(
                query=query,
                status="SUCCESS",
                execution_time_seconds=elapsed,
                payload_chars=len(raw_payload),
                safety=safety_eval,
                payload=compacted,
            )

        except QuarantineTriggered as qe:
            elapsed = round(time.perf_counter() - start, 3)
            logger.warning(f"[Pipeline] ❌ QUARANTINED | source={source_url} | reason={qe.reason} | score={qe.risk_score} | {elapsed}s")
            return PipelineResponse(
                query=query,
                status="QUARANTINED",
                execution_time_seconds=elapsed,
                quarantine_reason=qe.reason,
                risk_score=qe.risk_score,
            )

        except PipelineError as pe:
            elapsed = round(time.perf_counter() - start, 3)
            logger.error(f"[Pipeline] ⚠ PIPELINE_ERROR | {pe} | {elapsed}s")
            return PipelineResponse(
                query=query,
                status="SYSTEM_ERROR",
                execution_time_seconds=elapsed,
                quarantine_reason=f"PipelineError: {pe}",
            )

        except Exception as e:
            elapsed = round(time.perf_counter() - start, 3)
            logger.error(f"[Pipeline] ⚠ UNHANDLED | {type(e).__name__}: {e} | {elapsed}s")
            return PipelineResponse(
                query=query,
                status="SYSTEM_ERROR",
                execution_time_seconds=elapsed,
                quarantine_reason=f"UnhandledException: {type(e).__name__}",
            )