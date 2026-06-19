"""
band_ingestion_agent.py — Phalanx AI
Band-connected Ingestion Agent (Stage 1)
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

from agents import IngestionAgent

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("phalanx.band.ingestion")
logging.getLogger("thenvoi").setLevel(logging.DEBUG)

SYSTEM_PROMPT = """
You are the Phalanx Ingestion Agent — Stage 1 of a 3-stage AI security firewall pipeline.

Your job:
1. When a user sends you a search query, call the
   `run_ingestion` tool to fetch raw web content for that query.
2. After ingestion succeeds, @mention the Security Agent by name and hand off the raw HTML
   payload so it can run Stage 2 security evaluation.
3. If ingestion fails, report the error clearly to the user.
4. After composing the handoff message, you MUST call `thenvoi_send_message` to actually post
   it. Composing text in your reasoning does nothing on its own.

CRITICAL — NEVER SKIP RE-RUNNING, EVEN IF YOU REMEMBER DOING THIS BEFORE:
Every time a user sends you a query — even one that looks identical or similar to an earlier
one in this same conversation — you MUST call `run_ingestion` again and send a FRESH, COMPLETE
handoff with the actual payload. Do NOT reply with a summary like "I have already initiated
this" or "I already handed this off" instead of actually doing the work. Memory of a past turn
is never a substitute for doing it again this turn. Every user message gets its own full run,
with no exceptions, regardless of what happened earlier in this conversation.

MENTION FORMAT — copy this exactly, never improvise it:
Always write the mention as exactly: @PhalanxSecurity
Never write a full path like "@dharshansri2007/phalanxsecurity", never insert a space inside
the mention token, and never substitute the human user's name for the agent's name. The
mention must resolve to the Security Agent, not to a person.

HANDOFF FORMAT (always use this exact format when handing off to Security):
  @PhalanxSecurity INGEST_COMPLETE | query="<original query>" | chars=<N> | payload follows:
  <raw HTML content>

You are part of a multi-agent cybersecurity pipeline. Be concise and technical in your messages.
Never modify or summarize the raw HTML — hand it off exactly as ingested so the security agent
can inspect the actual attack surface.
"""


@tool
async def run_ingestion(query: str) -> str:
    """Fetch raw web content for a search query via Bright Data SERP + page fetch."""
    try:
        result = await IngestionAgent.execute(query)
        html = result["raw_html"]
        source = result.get("source_url", "unknown")
        fallback = result.get("fallback_used", False)
        status = "FALLBACK_SNIPPETS" if fallback else "RAW_HTML"
        preview = html[:200].replace("\n", " ")

        MAX_HANDOFF_CHARS = 8000
        payload_for_handoff = html[:MAX_HANDOFF_CHARS]

        return (
            f"INGESTION_OK | status={status} | source={source} | "
            f"total_chars={len(html)} | handoff_chars={len(payload_for_handoff)} | "
            f"preview={preview!r}\n\n"
            f"FULL_PAYLOAD:\n{payload_for_handoff}"
        )
    except Exception as e:
        return f"INGESTION_FAILED | error={type(e).__name__}: {e}"


async def main():
    load_dotenv()
    agent_id, api_key = load_agent_config("ingestion_agent")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.environ.get("GEMINI_API_KEY"),
    )

    adapter = LangGraphAdapter(
        llm=llm,
        checkpointer=InMemorySaver(),
        additional_tools=[run_ingestion],
        custom_section=SYSTEM_PROMPT,
    )

    agent = Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
        ws_url=os.getenv("THENVOI_WS_URL"),
        rest_url=os.getenv("THENVOI_REST_URL"),
    )

    logger.info("Phalanx Ingestion Agent connected to Band. Waiting for queries...")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())