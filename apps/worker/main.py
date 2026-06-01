from fastapi import FastAPI, UploadFile, File, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
import json
import re
import hashlib
from io import BytesIO
from pypdf import PdfReader
from groq import Groq, RateLimitError
from typing import Optional, List, Dict, Any

from ai.cv_generator import empty_profile
from ai.resume_parser import parse_resume_text
from export.pdf_export import export_pdf

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("hirevault-worker")

app = FastAPI(title="HireVault Worker", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExportPDFRequestModel(BaseModel):
    profile: dict
    design_prefs: dict

class SuggestionRequestModel(BaseModel):
    section_type: str
    current_text: str
    target_role: Optional[str] = None
    job_description: Optional[str] = None
    full_cv_context: Optional[Dict[str, Any]] = None
    client_cv_hash: Optional[str] = None

class AISuggestionResponseModel(BaseModel):
    score: int
    critiques: List[str]
    optimized_suggestions: List[str]
    recommended_skills: List[str]
    cv_hash_checksum: str

class TailorRequestModel(BaseModel):
    full_cv_context: Dict[str, Any]
    job_description: str
    target_role: Optional[str] = None

groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None

SUGGESTION_SYSTEM_PROMPT = """You are an elite corporate technical recruiter and expert ATS (Applicant Tracking System) optimization assistant.
Your goal is to cross-examine a candidate's CV information against their target professional role and target job description to maximize their interview conversion rate.

Analyze the provided inputs with a focus on:
1. The Action-Result Framework: Rewriting descriptions to lead with crisp verbs and showcase numerical business impacts.
2. Skill Deficit Matching: Comparing their complete CV skill matrix against the provided Job Description to pinpoint missing industry keywords or technologies they should include.
3. Clarity and Density: Eliminating buzzwords, fluff phrases, and passive language.

You MUST return a JSON object with the exact following keys:
{
  "score": <integer from 1 to 100 representing current ATS match strength or readiness>,
  "critiques": [<list of strings detailing specific issues, missing details, or stylistic flaws>],
  "optimized_suggestions": [<list of 2 to 3 high-impact rewritten alternatives for the text or section provided>],
  "recommended_skills": [<list of missing professional/technical skills explicitly extracted from the Job Description that the candidate should add to their CV based on their field>]
}
"""

TAILOR_SYSTEM_PROMPT = """You are an advanced AI resume architect and corporate talent consultant. 
Your task is to take a candidate's complete, existing CV profile data and dynamically tailor it to match a specific target Job Description (JD).

You must optimize the document for maximum ATS parsing relevance while maintaining absolute truthfulness to the candidate's core career history. Do not invent entirely new jobs or degrees.

Execute these precise adaptations:
1. Personal Summary: Rewrite to highlight exactly how the candidate's past experience addresses the main pain points outlined in the JD.
2. Work Experience & Projects: Re-phrase bullet descriptions using the Action-Result framework, elevating matching methodologies, engineering tasks, and tools specified in the JD to the beginning of sentences.
3. Skills Categorization: Re-order and enrich technical tags to prioritize structural keywords present in the JD.

You MUST return a valid JSON object matching the exact original CV profile schema structure:
{
  "personal": { "full_name": "...", "email": "...", "summary": "..." },
  "experience": [ { "company": "...", "role": "...", "bullets": ["...", "..."] } ],
  "education": [ ... ],
  "projects": [ ... ],
  "skills": { "technical": [ ... ], "soft": [ ... ], "languages": [ ... ] }
}
"""

def calculate_payload_hash(cv_context: dict, target_role: str) -> str:
    serialized = json.dumps(cv_context, sort_keys=True) + str(target_role)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/cv/init")
async def cv_init():
    logger.info("Handling /cv/init request")
    profile = empty_profile()
    return {"profile": profile}

@app.post("/cv/parse")
async def cv_parse(file: UploadFile = File(...)):
    logger.info(f"Handling /cv/parse request for file: {file.filename}")
    filename = file.filename.lower()
    
    if not (filename.endswith(".pdf") or filename.endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")
        
    try:
        content = await file.read()
        extracted_text = ""
        
        if filename.endswith(".pdf"):
            logger.info("Extracting text from PDF file.")
            pdf_file = BytesIO(content)
            reader = PdfReader(pdf_file)
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
        else:
            logger.info("Reading text from TXT file.")
            extracted_text = content.decode("utf-8", errors="ignore")
            
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No readable text could be extracted from this file.")
            
        logger.info(f"Extracted {len(extracted_text)} characters. Starting Groq parse pipeline.")
        structured_profile = await parse_resume_text(extracted_text)
        
        return {"profile": structured_profile}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed parsing file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal parsing error: {str(e)}")

@app.post("/cv/export-pdf")
async def cv_export_pdf(req: ExportPDFRequestModel):
    logger.info("Handling /cv/export-pdf request")
    try:
        pdf_bytes = await export_pdf(req.profile, req.design_prefs)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=cv-optimized.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        logger.error(f"Failed exporting PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")

@app.post("/cv/suggest", response_model=AISuggestionResponseModel)
async def cv_suggest(req: SuggestionRequestModel):
    logger.info(f"Handling advanced /cv/suggest request for section: {req.section_type}")
    
    if not groq_client:
        logger.error("Groq client not initialized. Check GROQ_API_KEY.")
        raise HTTPException(
            status_code=503, 
            detail="Groq suggestion service is temporarily unavailable due to missing configuration."
        )

    if not req.full_cv_context:
        raise HTTPException(status_code=400, detail="CV Context required for deep analysis.")

    role_to_analyze = req.target_role.strip() if (req.target_role and req.target_role.strip()) else "Target Professional Role"
    current_hash = calculate_payload_hash(req.full_cv_context, role_to_analyze)

    try:
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

        calculated_base_modifier = 0
        if req.job_description and req.full_cv_context:
            skills_obj = req.full_cv_context.get("skills", {})
            user_skills = []
            
            if isinstance(skills_obj, dict):
                user_skills = skills_obj.get("technical", []) + skills_obj.get("soft", [])
            elif isinstance(skills_obj, list):
                user_skills = skills_obj
                
            matched_tokens = [s for s in user_skills if re.search(r'\b' + re.escape(str(s)) + r'\b', req.job_description, re.IGNORECASE)]
            if user_skills:
                calculated_base_modifier = int((len(matched_tokens) / max(len(user_skills), 1)) * 100)

        user_payload = {
            "section_being_edited": req.section_type,
            "current_input_text": req.current_text,
            "target_role": role_to_analyze,
            "target_job_description": req.job_description or "Not Provided",
            "current_full_cv_data": req.full_cv_context or {},
            "algorithmic_keyword_match_baseline": calculated_base_modifier
        }
        
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": SUGGESTION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze and optimize the following payload context:\n\n{json.dumps(user_payload, indent=2)}"}
            ],
            model=model,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        response_text = response.choices[0].message.content
        logger.info("Successfully received structural ATS diagnostics from Groq.")
        
        parsed_json = json.loads(response_text)
        
        return AISuggestionResponseModel(
            score=int(parsed_json.get("score", 0)),
            critiques=list(parsed_json.get("critiques", [])),
            optimized_suggestions=list(parsed_json.get("optimized_suggestions", [])),
            recommended_skills=list(parsed_json.get("recommended_skills", [])),
            cv_hash_checksum=current_hash
        )
        
    except RateLimitError as rle:
        logger.warning(f"Groq API rate limit constraint hit: {str(rle)}")
        raise HTTPException(
            status_code=429,
            detail="AI analyzing tokens are temporarily cooling down. Please save canvas or try again in a few minutes."
        )
    except Exception as e:
        logger.error(f"Failed to generate advanced ATS suggestion: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"ATS suggestion generation error: {str(e)}")

@app.post("/cv/tailor")
async def cv_global_tailor(req: TailorRequestModel):
    logger.info("Executing global whole-CV tailoring analysis loop via Groq")
    
    if not groq_client:
        logger.error("Groq client not initialized. Check GROQ_API_KEY.")
        raise HTTPException(
            status_code=503,
            detail="Groq suggestion service is temporarily unavailable due to missing configuration."
        )
        
    if not req.job_description.strip():
        raise HTTPException(status_code=400, detail="A valid Job Description must be provided for tailoring.")

    try:
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        user_payload = {
            "current_cv_data": req.full_cv_context,
            "target_job_description": req.job_description,
            "target_role_override": req.target_role or req.full_cv_context.get("personal", {}).get("target_role", "Professional Candidate")
        }
        
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": TAILOR_SYSTEM_PROMPT},
                {"role": "user", "content": f"Tailor this profile structure globally to perfectly match the target requirements:\n\n{json.dumps(user_payload, indent=2)}"}
            ],
            model=model,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        tailored_profile = json.loads(response.choices[0].message.content)
        logger.info("Global whole-CV profile successfully optimized and restructured.")
        return {"profile": tailored_profile}
        
    except Exception as e:
        logger.error(f"Global tailoring loop pipeline failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Tailoring engine compilation error: {str(e)}")