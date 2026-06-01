import logging

logger = logging.getLogger(__name__)

def empty_profile() -> dict:
    """
    Returns a blank CV profile initialized with sensible default structures,
    matching packages/shared/src/schemas/api.ts.
    """
    logger.info("Initializing empty CV profile structure.")
    return {
        "personal": {
            "full_name": "",
            "email": "",
            "phone": "",
            "location": "",
            "linkedin_url": "",
            "website_url": "",
            "summary": ""
        },
        "experience": [],
        "education": [],
        "projects": [],
        "skills": {
            "technical": [],
            "soft": [],
            "languages": []
        },
        "target_roles": [],
        "design_prefs": {
            "theme": "modern_minimalist",
            "accent_color": "#1d9e75",
            "font_heading": "Inter",
            "font_body": "Inter"
        }
    }
