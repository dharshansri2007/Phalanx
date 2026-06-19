"""
band_security_agent.py — Phalanx AI
Band-connected Security Agent (Stage 2)
"""

import os
import asyncio
import logging
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.memory import InMemorySaver
from band import Agent
from band.adapters import LangGraphAdapter
from band.config import load_agent_config

from agents import SecurityAgent, QuarantineTriggered
from proxy_client import LobsterTrapClient
from stats_agent import StatisticalAgent

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("phalanx.band.security")

# ── DEBUG VISIBILITY ─────────────────────────────────────────────────────
# Per Band's own docs: the LLM only actually posts to the room when it
# explicitly calls the `thenvoi_send_message` tool — generating reply text
# in its reasoning is NOT the same as sending it. This line surfaces
# `[STREAM] on_tool_start: thenvoi_send_message` in the logs so you can see
# directly whether the agent is calling that tool or silently finishing a
# turn without ever sending anything.
logging.getLogger("thenvoi").setLevel(logging.DEBUG)

SYSTEM_PROMPT = """
You are the Phalanx Security Agent — Stage 2 of a 3-stage AI security firewall pipeline.

WORKFLOW (follow these steps in order, every single turn):
1. When you receive a message containing INGEST_COMPLETE or FULL_PAYLOAD:, extract the raw
   HTML text that follows "FULL_PAYLOAD:" and call the `run_security_evaluation` tool with
   that text as the `raw_html` argument.
2. Read the tool's result string. It starts with either "QUARANTINED" or "CLEARED".
3. Compose ONE of the two messages below based on that result.
4. CRITICAL — LAST STEP, NEVER SKIP IT: you MUST then call `thenvoi_send_message` to actually
   post that composed message into the room. Writing the text in your own reasoning does
   nothing — no other agent or human sees it, and the pipeline silently dies — until you
   explicitly call thenvoi_send_message with that text as the message content. A turn that
   ends without calling thenvoi_send_message is a turn that accomplished nothing.

IF THE TOOL RESULT STARTS WITH "QUARANTINED" — send this via thenvoi_send_message:
  🚨 QUARANTINE ALERT 🚨
  Threat detected in ingested payload.
  Reason: <threat_type from the tool result>
  Risk Score: <score from the tool result>
  The payload has been blocked and logged. No content was passed downstream.

IF THE TOOL RESULT STARTS WITH "CLEARED" — send this via thenvoi_send_message:
  @PhalanxCompactor SECURITY_CLEARED | risk_score=<N> | source_chars=<N> | payload follows:
  <raw HTML content you received>

You are the security gatekeeper. Be decisive. Never finish a turn without calling
thenvoi_send_message — an evaluation that never gets sent is the same as one that never happened.
"""


@tool
async def run_security_evaluation(raw_html: str) -> str:
    """Runs all 3 security tiers: Proxy regex, Stats, Gemini LLM."""
    try:
        proxy_result = await LobsterTrapClient.check_payload(raw_html)
        if not proxy_result.get("is_safe", False):
            return (
                f"QUARANTINED | stage=PROXY_REGEX | "
                f"reason={proxy_result.get('reason')} | risk_score=1.0"
            )

        stats_result = await StatisticalAgent.execute(raw_html)
        if not stats_result.get("is_safe", False):
            return (
                f"QUARANTINED | stage=STATISTICAL | "
                f"reason={stats_result.get('reason')} | "
                f"risk_score={stats_result.get('risk_score', 1.0)}"
            )

        try:
            sec_result = await SecurityAgent.execute(raw_html)
            return (
                f"CLEARED | risk_score={sec_result.get('risk_score', 0.0)} | "
                f"explanation={sec_result.get('explanation', '')[:200]}"
            )
        except QuarantineTriggered as qe:
            return (
                f"QUARANTINED | stage=GEMINI_LLM | "
                f"reason={qe.reason} | risk_score={qe.risk_score}"
            )

    except Exception as e:
        return f"QUARANTINED | stage=EVALUATOR_EXCEPTION | reason={type(e).__name__}:{e} | risk_score=1.0"


async def main():
    load_dotenv()
    agent_id, api_key = load_agent_config("security_agent")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.environ.get("GEMINI_API_KEY"),
    )

    adapter = LangGraphAdapter(
        llm=llm,
        checkpointer=InMemorySaver(),
        additional_tools=[run_security_evaluation],
        custom_section=SYSTEM_PROMPT,
    )

    agent = Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
        ws_url=os.getenv("THENVOI_WS_URL"),
        rest_url=os.getenv("THENVOI_REST_URL"),
    )

    logger.info("Phalanx Security Agent connected to Band. Awaiting payloads from Ingestion Agent...")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())