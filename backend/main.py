"""
main.py — Phalanx AI

"""
import os
import uvicorn
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from schemas import AnalysisRequest, PipelineResponse
from pipelines import PhalanxPipeline

from stats_agent import StatisticalAgent
from schemas import AnalysisRequest, PipelineResponse, StatsCheckRequest, StatsCheckResponse

# ─────────────────────────────────────────
# LOGGING — configure once
# ─────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("phalanx.api")


# ─────────────────────────────────────────
# IN-MEMORY QUARANTINE STORE
# ─────────────────────────────────────────
_quarantine_store: dict[str, dict] = {}


# ─────────────────────────────────────────
# LIFESPAN — startup + shutdown
# ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ──────────────────────────
    logger.info("=" * 52)
    logger.info("  PHALANX AI — PIPELINE BOOTING")
    logger.info("=" * 52)

    
    missing = [
        k for k in ["GCP_PROJECT_ID", "BRIGHT_DATA_API_KEY", "AI_ML_API_KEY"]
        if not getattr(settings, k, None)
    ]
    if missing:
        logger.error(f"✗ Missing required config keys: {missing}")
        raise RuntimeError(f"Missing config: {missing}")

    logger.info(f"✓ Config validated | GCP Project: {settings.GCP_PROJECT_ID}")
    logger.info("✓ All agents ready — awaiting requests")
    logger.info("=" * 52)

    yield  # ← app is live here

    # ── SHUTDOWN ─────────────────────────
    logger.info("Phalanx API shutting down cleanly.")


# ─────────────────────────────────────────
# APP
# ─────────────────────────────────────────
app = FastAPI(
    title="Phalanx AI Security API",
    description="Air-gapped 3-stage LLM firewall for secure autonomous agent data ingestion.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",       
    redoc_url="/redoc",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# REQUEST ID MIDDLEWARE
# Every request gets a short UUID. Shows up in every log line.
# Returned as X-Request-ID header — useful for debugging.
# ─────────────────────────────────────────
@app.middleware("http")
async def attach_request_id(request: Request, call_next):
    rid = str(uuid.uuid4())[:8]
    request.state.request_id = rid
    logger.info(f"[{rid}] → {request.method} {request.url.path}")
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    logger.info(f"[{rid}] ← {response.status_code}")
    return response


# ─────────────────────────────────────────
# GLOBAL EXCEPTION HANDLER
# Catches anything that slips past endpoint try/except.
# Judges never see a raw Python traceback — always clean JSON.
# ─────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    rid = getattr(request.state, "request_id", "unknown")
    logger.error(f"[{rid}] UNHANDLED: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "detail": f"{type(exc).__name__}: {str(exc)}",
            "request_id": rid,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# ─────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check() -> dict[str, Any]:
    """
    Detailed health check.
    Use this as your Cloud Run readiness probe URL.
    """
    return {
        "status": "ONLINE",
        "service": "Phalanx AI Security API",
        "version": "1.0.0",
        "gcp_project": settings.GCP_PROJECT_ID,
        "quarantine_queue_depth": len([v for v in _quarantine_store.values() if not v["reviewed"]]),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/v1/analyze", response_model=PipelineResponse, tags=["Pipeline"])
async def analyze_query(request: AnalysisRequest, req: Request) -> PipelineResponse:
    """
    Main pipeline trigger.
    Stage 1 → Ingestion → Stage 2 → Security → Stage 3 → Compression.
    Returns PipelineResponse: status is SUCCESS | QUARANTINED | SYSTEM_ERROR.
    """
    rid = getattr(req.state, "request_id", "unknown")
    logger.info(f"[{rid}] Analyzing: {request.query!r}")

    result: PipelineResponse = await PhalanxPipeline.run(request.query)

    # Auto-push quarantined payloads into the SOC review queue
    if result.status == "QUARANTINED":
        alert_id = str(uuid.uuid4())
        _quarantine_store[alert_id] = {
            "id": alert_id,
            "query": request.query,
            "reason": result.quarantine_reason,
            "risk_score": result.risk_score,
            "flagged_at": datetime.now(timezone.utc).isoformat(),
            "reviewed": False,
            "resolution": None,
        }
        logger.warning(f"[{rid}] Alert {alert_id} pushed to quarantine queue.")

    return result


@app.get("/api/v1/quarantine", tags=["SOC Dashboard"])
async def get_quarantine_queue() -> dict[str, Any]:
    """
    Returns all unreviewed quarantine alerts.
    Your frontend dashboard polls this to populate the alert cards.
    """
    pending = [v for v in _quarantine_store.values() if not v["reviewed"]]
    return {
        "total_pending": len(pending),
        "alerts": pending,
    }


@app.post("/api/v1/quarantine/{alert_id}/approve", tags=["SOC Dashboard"])
async def approve_alert(alert_id: str) -> dict[str, str]:
    """SOC analyst approves an alert. The [Approve Patch] button hits this."""
    if alert_id not in _quarantine_store:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id!r} not found.")
    _quarantine_store[alert_id].update({"reviewed": True, "resolution": "APPROVED"})
    logger.info(f"[SOC] Alert {alert_id} APPROVED.")
    return {"status": "APPROVED", "alert_id": alert_id}


@app.post("/api/v1/quarantine/{alert_id}/reject", tags=["SOC Dashboard"])
async def reject_alert(alert_id: str) -> dict[str, str]:
    """SOC analyst rejects an alert."""
    if alert_id not in _quarantine_store:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id!r} not found.")
    _quarantine_store[alert_id].update({"reviewed": True, "resolution": "REJECTED"})
    logger.info(f"[SOC] Alert {alert_id} REJECTED.")
    return {"status": "REJECTED", "alert_id": alert_id}

@app.post("/api/v1/stats-check", response_model=StatsCheckResponse, tags=["Pipeline"])
async def stats_check(request: StatsCheckRequest) -> StatsCheckResponse:
    """
    Standalone Tier-1.5 check. Runs ONLY the pure-math statistical agent
    directly on the text you send, no SERP search, no page fetch, no
    Gemini call. The Stats Explorer UI hits this endpoint so the textarea
    content itself gets analyzed, not used as a search query.
    """
    result = await StatisticalAgent.execute(request.text)
    return StatsCheckResponse(**result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
