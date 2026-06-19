"""
agents.py — Phalanx AI

"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# 1. Incoming request from frontend / user
class AnalysisRequest(BaseModel):
    query: str = Field(..., description="The search query or target URL to ingest and analyze")
    bypass_cache: bool = Field(default=False, description="Force a fresh web scrape instead of pulling from ChromaDB")

# 2. Individual result item from Bright Data SERP API
class ScrapedItem(BaseModel):
    title: str
    url: str
    snippet: str
    source: str = "BrightData_SERP"

# 3. Payload structure after passing through the local proxy and Gemini Evaluator
class SafetyEvaluation(BaseModel):
    is_safe: bool = Field(..., description="True if no prompt injection or malicious payloads were found")
    risk_score: float = Field(..., description="Risk score from 0.0 (perfectly safe) to 1.0 (highly dangerous)")
    threat_type: Optional[str] = Field(default=None, description="Type of injection detected (e.g., 'Indirect Injection', 'System Override')")
    explanation: Optional[str] = Field(default=None, description="Brief justification from the evaluation agent")

# 4. Final compacted summary payload from the AI/ML API (Llama 3)
class CompactedSummary(BaseModel):
    summary_text: str = Field(..., description="The sanitized, 500-token condensed knowledge snippet")
    tokens_used: int
    generated_at: datetime = Field(default_factory=datetime.utcnow)

# 5. Complete unified response sent back to the frontend dashboard
class PipelineResponse(BaseModel):
    query: str
    status: str = Field(..., description="Can be 'SUCCESS', 'QUARANTINED', or 'SYSTEM_ERROR'")
    execution_time_seconds: float
    payload_chars: Optional[int] = 0
    quarantine_reason: Optional[str] = None
    risk_score: Optional[float] = None
    safety: Optional[SafetyEvaluation] = None # Make optional since Quarantine skips this
    payload: Optional[CompactedSummary] = None

    # 6. Standalone Tier-1.5 stats check — bypasses ingestion entirely
class StatsCheckRequest(BaseModel):
    text: str = Field(..., description="Raw text or payload to scan directly with the statistical agent")

class StatsCheckResponse(BaseModel):
    is_safe: bool
    risk_score: float
    reason: str
    stage: str
    confidence: str
    metrics: dict