import logging

logger = logging.getLogger(__name__)

async def score(user_profile: dict, job_listing: dict) -> int:
    logger.info(f"Scoring job for user {user_profile.get('id')}...")
    # Placeholder scoring logic
    return 85
