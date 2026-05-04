import logging

logger = logging.getLogger(__name__)

async def generate(user_profile: dict, job_listing: dict) -> str:
    logger.info("Generating cover letter...")
    return "Generated Cover Letter Content"
