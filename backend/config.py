"""
config.py — Phalanx AI
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # 1. Google Cloud Auth
    GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
    # Optional — only used for local dev with a key file. On Cloud Run,
    # the attached service account's identity is used automatically instead.
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    # 2. External APIs
    BRIGHT_DATA_API_KEY = os.getenv("BRIGHT_DATA_API_KEY")
    BRIGHT_DATA_ZONE = os.getenv("BRIGHT_DATA_ZONE")
    AI_ML_API_KEY = os.getenv("AI_ML_API_KEY")

    # 3. Local Infrastructure
    LOCAL_PROXY_URL = "http://localhost:8080"

    def __init__(self):
        # Only the things the pipeline can't function without at all.
        if not all([self.GCP_PROJECT_ID, self.BRIGHT_DATA_API_KEY, self.AI_ML_API_KEY]):
            raise ValueError("Missing required API keys/config. The Phalanx pipeline cannot boot without them.")

settings = Settings()