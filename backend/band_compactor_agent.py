"""
band_compactor_agent.py — Phalanx AI
Band-connected Compactor Agent (Stage 3)
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

from agents import IngestionAgent, CompactorAgent

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("phalanx.band.compactor")

SYSTEM_PROMPT = """
You are the Phalanx Compactor Agent — Stage 3 (final stage) of a 3-stage AI security firewall.

Your job:
1. When you receive a message containing `SECURITY_CLEARED` and `payload follows:`, extract
   the raw HTML and call the `run_compaction` tool to produce a sanitized summary.
2. Post the final result to the chat room in this format:

✅ PIPELINE COMPLETE
Query: <original query if available>
Risk Score: <from security stage>
Summary:
<the compressed 400-500 token knowledge summary>

---
Powered by Phalanx AI | Ingestion → Security → Compaction complete.

You are the final stage. Your output is the safe, sanitized knowledge that the enterprise
AI system can now use. Be clear and professional in presenting the result.
"""


@tool
async def run_compaction(raw_html: str) -> str:
    """Strip HTML tags from security-cleared content and compress into
    a dense 400-500 token factual summary using Llama-3.3-70B."""
    try:
        clean_text = IngestionAgent.extract_visible_text(raw_html)
        if not clean_text.strip():
            return "COMPACTION_FAILED | reason=EmptyTextAfterStripping"

        summary = await CompactorAgent.execute(clean_text)
        return f"COMPACTION_OK | output_chars={len(summary)}\n\nSUMMARY:\n{summary}"
    except Exception as e:
        return f"COMPACTION_FAILED | error={type(e).__name__}: {e}"


async def main():
    load_dotenv()
    agent_id, api_key = load_agent_config("compactor_agent")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.environ.get("GEMINI_API_KEY"),
    )

    adapter = LangGraphAdapter(
        llm=llm,
        checkpointer=InMemorySaver(),
        additional_tools=[run_compaction],
        custom_section=SYSTEM_PROMPT,
    )

    agent = Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
        ws_url=os.getenv("THENVOI_WS_URL"),
        rest_url=os.getenv("THENVOI_REST_URL"),
    )

    logger.info("Phalanx Compactor Agent connected to Band. Awaiting cleared payloads...")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())