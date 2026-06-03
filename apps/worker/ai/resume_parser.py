import os
import json
import logging
import re
from groq import Groq
from dotenv import load_dotenv
from ai.cv_generator import empty_profile

load_dotenv()

logger = logging.getLogger(__name__)

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    logger.warning("GROQ_API_KEY not found in environment variables. Groq resume parsing will fall back to heuristic parse.")
    client = None
else:
    client = Groq(api_key=api_key)

SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) parser and resume engineer.
Your task is to take raw text extracted from a resume/CV and convert it into a structured, highly compliant JSON object matching the schema below.

CRITICAL RULES:
1. Return ONLY a valid JSON object. Do not include any explanation, intro, markdown block backticks (e.g. do NOT wrap in ```json), or extra text.
2. Ensure every date field is formatted clearly (e.g., "YYYY-MM", "YYYY", or "Present").
3. Experience items should contain a detailed "bullets" array explaining achievements (3-5 items per job if present).
4. Strictly follow the JSON schema structure specified below. Do not add or change any keys.

JSON SCHEMA:
{
  "personal": {
    "full_name": "Full Name",
    "email": "email@example.com",
    "phone": "Phone number",
    "location": "City, Country",
    "linkedin_url": "URL",
    "website_url": "URL",
    "summary": "Short professional summary/headline"
  },
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, Country or Remote",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or Present",
      "is_current": true/false,
      "bullets": ["Bullet point 1", "Bullet point 2"]
    }
  ],
  "education": [
    {
      "institution": "University/School Name",
      "degree": "Degree (e.g. B.Sc.)",
      "field": "Field of Study (e.g. Computer Science)",
      "start_year": "YYYY",
      "end_year": "YYYY",
      "gpa": "GPA (optional, else null or empty)"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "url": "Project URL (optional)",
      "description": "Short description of the project and your role",
      "tech_stack": ["React", "Python"]
    }
  ],
  "skills": {
    "technical": ["Skill A", "Skill B"],
    "soft": ["Skill C", "Skill D"],
    "languages": [
      {
        "name": "Language",
        "level": "Native/Fluent/Intermediate/Beginner"
      }
    ]
  },
  "target_roles": ["Role 1", "Role 2"],
  "design_prefs": {
    "theme": "modern_minimalist",
    "accent_color": "#1d9e75",
    "font_heading": "Inter",
    "font_body": "Inter"
  }
}
"""

def heuristic_fallback_parse(text: str) -> dict:
    """
    Extremely simple heuristic backup parser when Groq is unavailable.
    """
    logger.info("Running heuristic fallback parse on resume text.")
    profile = empty_profile()
    
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        profile["personal"]["email"] = email_match.group(0)
        
    phone_match = re.search(r'\+?\d[\d\-\s\(\)]{8,16}\d', text)
    if phone_match:
        profile["personal"]["phone"] = phone_match.group(0)
        
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines:
        for line in lines[:3]:
            if len(line.split()) in [2, 3] and not "@" in line:
                profile["personal"]["full_name"] = line
                break
                
    profile["personal"]["summary"] = f"Heuristically imported CV. Please fill details live."
    
    return profile

async def parse_resume_text(raw_text: str) -> dict:
    """
    Main async parser using Groq to map resume text to CVProfile schema.
    """
    if not client:
        logger.warning("Groq client not initialized. Falling back to simple heuristic parsing.")
        return heuristic_fallback_parse(raw_text)
        
    try:
        logger.info("Calling Groq API for resume text parsing.")
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        try:
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Parse the following resume text:\n\n{raw_text}"}
                ],
                model=model,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
        except Exception as e:
            if "rate_limit_exceeded" in str(e) or "429" in str(e):
                logger.warning(f"Rate limit exceeded for model {model}. Falling back to llama-3.1-8b-instant...")
                model = "llama-3.1-8b-instant"
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": f"Parse the following resume text:\n\n{raw_text}"}
                    ],
                    model=model,
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
            else:
                raise e
        
        content = response.choices[0].message.content
        logger.info("Successfully received structured response from Groq.")
        parsed_json = json.loads(content)
        
        base_profile = empty_profile()
        
        if "personal" in parsed_json:
            for k, v in parsed_json["personal"].items():
                base_profile["personal"][k] = v
                
        for section in ["experience", "education", "projects", "target_roles"]:
            if section in parsed_json and isinstance(parsed_json[section], list):
                base_profile[section] = parsed_json[section]
                
        if "skills" in parsed_json and isinstance(parsed_json["skills"], dict):
            for k in ["technical", "soft"]:
                if k in parsed_json["skills"] and isinstance(parsed_json["skills"][k], list):
                    base_profile["skills"][k] = parsed_json["skills"][k]
            if "languages" in parsed_json["skills"] and isinstance(parsed_json["skills"]["languages"], list):
                base_profile["skills"]["languages"] = parsed_json["skills"]["languages"]
                
        if "design_prefs" in parsed_json and isinstance(parsed_json["design_prefs"], dict):
            for k in ["theme", "accent_color", "font_heading", "font_body"]:
                if k in parsed_json["design_prefs"]:
                    base_profile["design_prefs"][k] = parsed_json["design_prefs"][k]
                    
        return base_profile
        
    except Exception as e:
        logger.error(f"Error parsing with Groq model: {str(e)}. Falling back to heuristics.", exc_info=True)
        return heuristic_fallback_parse(raw_text)
