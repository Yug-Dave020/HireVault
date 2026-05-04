import logging

logger = logging.getLogger(__name__)

async def analyze(jd_text: str) -> dict:
    logger.info("Analyzing job description...")
    # Basic structure for a real-looking stub
    return {
        "title": "Extracted Title",
        "company": "Extracted Company",
        "requirements": [],
        "raw_text": jd_text[:100] + "..."
    }
