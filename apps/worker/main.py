from fastapi import FastAPI, UploadFile, File, Response, HTTPException, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import tempfile
from supabase import create_client, Client
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
from auth import get_current_user
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger("hirevault-worker")

app = FastAPI(title="HireVault Worker", version="0.1.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExportPDFRequestModel(BaseModel):
    profile: Dict[str, Any]
    design_prefs: Optional[Dict[str, Any]] = None

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

class InterviewChatRequest(BaseModel):
    persona_id: str
    current_stage: str
    target_position: str
    cv_profile: Dict[str, Any]
    message_history: List[Dict[str, str]]

class InterviewChatResponse(BaseModel):
    ai_message: str
    next_stage: str
    feedback_metadata: dict

class CoherenceRequestModel(BaseModel):
    cv_id: str

class RedTeamRequestModel(BaseModel):
    cv_id: str
    attack_mode: str

class VocalAnalysisRequest(BaseModel):
    transcript_text: str
    audio_duration_seconds: float
    session_id: str
    turn_index: int

class NegotiationTurnRequest(BaseModel):
    session_id: str
    user_message: str
    current_offer: int
    hidden_budget: int
    history: List[Dict[str, str]]

groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Optional[Client] = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

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
@limiter.limit("20/minute")
async def cv_init(request: Request, user_id: str = Depends(get_current_user)):
    logger.info("Handling /cv/init request")
    profile = empty_profile()
    return {"profile": profile}

@app.post("/cv/parse")
@limiter.limit("10/minute")
async def cv_parse(request: Request, file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
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
@limiter.limit("10/minute")
async def cv_export_pdf(request: Request, req: ExportPDFRequestModel, user_id: str = Depends(get_current_user)):
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
@limiter.limit("5/minute")
async def cv_suggest(request: Request, req: SuggestionRequestModel, user_id: str = Depends(get_current_user)):
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
        
        try:
            response = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": SUGGESTION_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Analyze and optimize the following payload context:\n\n{json.dumps(user_payload, indent=2)}"}
                ],
                model=model,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
        except Exception as e:
            if "rate_limit_exceeded" in str(e) or "429" in str(e):
                logger.warning(f"Rate limit exceeded for model {model}. Falling back to llama-3.1-8b-instant...")
                model = "llama-3.1-8b-instant"
                response = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": SUGGESTION_SYSTEM_PROMPT},
                        {"role": "user", "content": f"Analyze and optimize the following payload context:\n\n{json.dumps(user_payload, indent=2)}"}
                    ],
                    model=model,
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )
            else:
                raise e
        
        response_text = response.choices[0].message.content
        logger.info("Successfully received structural ATS diagnostics from Groq.")
        
        parsed_json = json.loads(response_text)
        
        def normalize_list(lst):
            out = []
            for item in lst:
                if isinstance(item, dict):
                    val = item.get("optimized_text") or item.get("suggestion") or item.get("description") or item.get("skill") or str(item)
                    out.append(str(val))
                else:
                    out.append(str(item))
            return out
        
        return AISuggestionResponseModel(
            score=int(parsed_json.get("score", 0)),
            critiques=normalize_list(parsed_json.get("critiques", [])),
            optimized_suggestions=normalize_list(parsed_json.get("optimized_suggestions", [])),
            recommended_skills=normalize_list(parsed_json.get("recommended_skills", [])),
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
@limiter.limit("5/minute")
async def cv_global_tailor(request: Request, req: TailorRequestModel, user_id: str = Depends(get_current_user)):
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
        
        try:
            response = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": TAILOR_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Tailor this profile structure globally to perfectly match the target requirements:\n\n{json.dumps(user_payload, indent=2)}"}
                ],
                model=model,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
        except Exception as e:
            if "rate_limit_exceeded" in str(e) or "429" in str(e):
                logger.warning(f"Rate limit exceeded for model {model}. Falling back to llama-3.1-8b-instant...")
                model = "llama-3.1-8b-instant"
                response = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": TAILOR_SYSTEM_PROMPT},
                        {"role": "user", "content": f"Tailor this profile structure globally to perfectly match the target requirements:\n\n{json.dumps(user_payload, indent=2)}"}
                    ],
                    model=model,
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
            else:
                raise e
        
        tailored_profile = json.loads(response.choices[0].message.content)
        logger.info("Global whole-CV profile successfully optimized and restructured.")
        return {"profile": tailored_profile}
        
    except Exception as e:
        logger.error(f"Global tailoring loop pipeline failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Tailoring engine compilation error: {str(e)}")

COHERENCE_SYSTEM_PROMPT = """You are a strict resume coherence auditor. Given a parsed resume JSON with sections: skills[], experience[{role, company, bullets[]}], projects[{name, bullets[]}], education[], perform the following checks and return ONLY valid JSON:
1. skill_orphans: skills listed but not evidenced anywhere in experience or project bullets (semantic match, not just exact string — 'ML' should match 'machine learning')
2. experience_underclaimed: technologies/tools mentioned in bullets but absent from the skills section
3. impact_gap: bullet points with no quantifiable metric (no numbers, percentages, or scale indicators)
4. timeline_flags: roles with suspicious overlapping dates or unexplained gaps > 6 months
5. seniority_mismatch: language used in bullets doesn't match the claimed seniority level of the role
6. keyword_density: skills section has >15 items with no grouping — flag as ATS noise risk
Return: { "score": 0, "skill_orphans": [{"skill": "", "suggestion": ""}], "experience_underclaimed": [{"term": "", "found_in": ""}], "impact_gap": [{"bullet": "", "rewrite_suggestion": ""}], "timeline_flags": [{"role": "", "issue": ""}], "seniority_mismatch": [{"role": "", "issue": ""}], "keyword_density_flag": false }"""

@app.post("/analyze/coherence")
@limiter.limit("5/minute")
async def analyze_coherence(request: Request, req: CoherenceRequestModel, user_id: str = Depends(get_current_user)):
    logger.info(f"Handling /analyze/coherence for CV ID: {req.cv_id}")
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq unavailable")
    
    # Fetch CV Variant
    res = await asyncio.to_thread(lambda: supabase.table("user_cv_variants").select("cv_profile, user_id").eq("id", req.cv_id).eq("user_id", user_id).execute())
    if not res.data:
        raise HTTPException(status_code=404, detail="CV not found or access denied")
        
    cv_data = res.data[0].get("cv_profile", {})
    user_id = res.data[0].get("user_id")
    
    try:
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": COHERENCE_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(cv_data, indent=2)}
            ],
            model=model,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        report = json.loads(response.choices[0].message.content)
        
        insert_payload = {
            "user_id": user_id,
            "cv_variant_id": req.cv_id,
            "score": report.get("score", 0),
            "skill_orphans": report.get("skill_orphans", []),
            "experience_underclaimed": report.get("experience_underclaimed", []),
            "impact_gap": report.get("impact_gap", []),
            "timeline_flags": report.get("timeline_flags", []),
            "seniority_mismatch": report.get("seniority_mismatch", []),
            "keyword_density_flag": report.get("keyword_density_flag", False)
        }
        await asyncio.to_thread(lambda: supabase.table("cv_coherence_reports").insert(insert_payload).execute())
        
        return report
    except Exception as e:
        logger.error(f"Coherence analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

REDTEAM_AGENT_A_PROMPT = """You are a hostile ATS system and a skeptical senior recruiter. Read this resume JSON and return a JSON array of attacks: [{"target_section": "...", "target_text": "...", "attack_type": "vague"|"unverifiable"|"keyword_stuffed"|"buzzword"|"gap", "severity": 1|2|3, "attack_reasoning": "..."}]. Be ruthless. Find at least 8 attacks."""

REDTEAM_AGENT_B_PROMPT = """You are an expert resume writer. Given an attack object and the original text, return: {"original": "...", "patched_version": "...", "reasoning": "..."}. The patch must be concrete, metric-driven, and ATS-friendly."""

@app.post("/analyze/redteam")
@limiter.limit("5/minute")
async def analyze_redteam(request: Request, req: RedTeamRequestModel, user_id: str = Depends(get_current_user)):
    logger.info(f"Handling /analyze/redteam for CV ID: {req.cv_id}")
    if not supabase or not groq_client:
        raise HTTPException(status_code=503, detail="Services unavailable")
        
    res = await asyncio.to_thread(lambda: supabase.table("user_cv_variants").select("cv_profile, user_id").eq("id", req.cv_id).eq("user_id", user_id).execute())
    if not res.data:
        raise HTTPException(status_code=404, detail="CV not found or access denied")
        
    cv_data = res.data[0].get("cv_profile", {})
    user_id = res.data[0].get("user_id")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    try:
        response_a = await asyncio.to_thread(
            lambda: groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": REDTEAM_AGENT_A_PROMPT},
                    {"role": "user", "content": json.dumps(cv_data, indent=2)}
                ],
                model=model,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
        )
        content_a = response_a.choices[0].message.content
        try:
            attacks_data = json.loads(content_a)
            attacks = attacks_data.get("attacks", attacks_data)
            if not isinstance(attacks, list):
                attacks = [attacks]
        except Exception:
            attacks = []
            
        clean_attacks = []
        attack_surface_score = 0
        for atk in attacks:
            if isinstance(atk, dict) and "target_text" in atk:
                clean_attacks.append(atk)
                attack_surface_score += atk.get("severity", 1) * 10
                
        attack_surface_score = min(attack_surface_score, 100)
        
        async def patch_attack(atk):
            try:
                prompt = f"Original text: {atk.get('target_text')}\nAttack rationale: {atk.get('attack_reasoning')}"
                resp = await asyncio.to_thread(
                    lambda: groq_client.chat.completions.create(
                        messages=[
                            {"role": "system", "content": REDTEAM_AGENT_B_PROMPT},
                            {"role": "user", "content": prompt}
                        ],
                        model=model,
                        temperature=0.2,
                        response_format={"type": "json_object"}
                    )
                )
                return json.loads(resp.choices[0].message.content)
            except Exception as e:
                logger.error(f"Agent B failed on attack: {e}")
                return None
                
        patches = await asyncio.gather(*(patch_attack(a) for a in clean_attacks))
        clean_patches = [p for p in patches if p]
        
        report = {
            "attack_surface_score": attack_surface_score,
            "attacks": clean_attacks,
            "patches": clean_patches
        }
        
        insert_payload = {
            "user_id": user_id,
            "cv_variant_id": req.cv_id,
            "attack_surface_score": attack_surface_score,
            "attacks": clean_attacks,
            "patches": clean_patches
        }
        await asyncio.to_thread(lambda: supabase.table("cv_redteam_reports").insert(insert_payload).execute())
        
        return report
    except Exception as e:
        logger.error(f"Redteam analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interview/vocal-analysis")
@limiter.limit("10/minute")
async def vocal_analysis(request: Request, req: VocalAnalysisRequest, user_id: str = Depends(get_current_user)):
    logger.info(f"Vocal analysis for session {req.session_id} turn {req.turn_index}")
    word_count = len(req.transcript_text.split())
    wpm = round((word_count / max(req.audio_duration_seconds, 1)) * 60)
    
    filler_words = ["um", "uh", "like", "you know", "basically", "literally", "so", "right"]
    transcript_lower = req.transcript_text.lower()
    filler_count = sum(transcript_lower.count(f) for f in filler_words)
    
    filler_rate = round((filler_count / max(word_count, 1)) * 100, 1)
    
    expected_speech_duration = word_count / 2.5
    silence_ratio = round(max(0, req.audio_duration_seconds - expected_speech_duration) / max(req.audio_duration_seconds, 1) * 100, 1)
    
    confidence_score = 100 - (filler_rate * 2) - (abs(wpm - 130) * 0.3)
    confidence_score = max(0, min(100, round(confidence_score)))
    
    metrics = {
        "wpm": wpm,
        "filler_rate": filler_rate,
        "silence_ratio": silence_ratio,
        "confidence_score": confidence_score
    }
    
    if supabase:
        res = await asyncio.to_thread(
            lambda: supabase.table("interview_transcripts")
            .select("id, feedback_metadata")
            .eq("session_id", req.session_id)
            .eq("message_owner", "user")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if res.data:
            transcript_id = res.data[0]["id"]
            existing_meta = res.data[0].get("feedback_metadata") or {}
            existing_meta.update({"vocal_metrics": metrics})
            
            await asyncio.to_thread(
                lambda: supabase.table("interview_transcripts")
                .update({"feedback_metadata": existing_meta})
                .eq("id", transcript_id)
                .execute()
            )
            
    return metrics

NEGOTIATION_AGENT_PROMPT = """You are an HR recruiter roleplaying a salary negotiation.
Your hidden maximum budget is ${hidden_budget}.
The current offer is ${current_offer}.
The user is negotiating. If they ask for more than your hidden budget, you must act reluctant and refuse firmly but professionally.
If they ask for something within budget, you can concede slightly or accept.
Analyze their negotiation tactic and give a feedback_score (1-100).
Return ONLY a JSON object: {"ai_response": "...", "new_offer": int, "feedback_score": int}"""

@app.post("/negotiate/turn")
@limiter.limit("10/minute")
async def negotiate_turn(request: Request, req: NegotiationTurnRequest, user_id: str = Depends(get_current_user)):
    if not groq_client:
        raise HTTPException(status_code=503, detail="Services unavailable")
        
    hidden_budget = req.hidden_budget
    history_text = "\n".join([f"{t.get('role', 'user')}: {t.get('content', '')}" for t in req.history])
    
    prompt = NEGOTIATION_AGENT_PROMPT.replace("${hidden_budget}", str(hidden_budget)).replace("${current_offer}", str(req.current_offer))
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    try:
        resp = await asyncio.to_thread(lambda: groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Transcript history:\n{history_text}\n\nUser just said: {req.user_message}\n\nRespond in JSON format."}
            ],
            model=model,
            temperature=0.4,
            response_format={"type": "json_object"}
        ))
        
        parsed = json.loads(resp.choices[0].message.content)
        ai_response = parsed.get("ai_response", "I'm sorry, I cannot meet that request.")
        new_offer = parsed.get("new_offer", req.current_offer)
        feedback_score = parsed.get("feedback_score", 50)
        
        return {
            "ai_response": ai_response,
            "new_offer": new_offer,
            "feedback_score": feedback_score
        }
    except Exception as e:
        logger.error(f"Negotiation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/skill-topology")
@limiter.limit("20/minute")
async def get_skill_topology(request: Request, user_id: str = Depends(get_current_user)):
    logger.info(f"Extracting skill topology for user: {user_id}")
    if not supabase:
        raise HTTPException(status_code=503, detail="Services unavailable")
        
    res = await asyncio.to_thread(lambda: supabase.table("user_cv_variants").select("id, cv_profile, label").eq("user_id", user_id).execute())
    if not res.data:
        return {"nodes": [], "links": []}
        
    nodes = []
    links = []
    node_set = set()
    
    for variant in res.data:
        v_id = variant["id"]
        v_name = variant.get("label", "CV Variant")
        nodes.append({"id": v_id, "group": 1, "name": v_name})
        node_set.add(v_id)
        
        cv_profile = variant.get("cv_profile", {})
        skills = cv_profile.get("skills", {})
        if isinstance(skills, dict):
            all_skills = skills.get("technical", []) + skills.get("soft", [])
        elif isinstance(skills, list):
            all_skills = skills
        else:
            all_skills = []
            
        for skill in all_skills:
            if not isinstance(skill, str): continue
            s_id = f"skill_{skill.lower()}"
            if s_id not in node_set:
                nodes.append({"id": s_id, "group": 2, "name": skill})
                node_set.add(s_id)
            links.append({"source": v_id, "target": s_id, "value": 1})
            
    return {"nodes": nodes, "links": links}

@app.post("/interview/chat", response_model=InterviewChatResponse)
@limiter.limit("10/minute")
async def interview_chat(request: Request, req: InterviewChatRequest, user_id: str = Depends(get_current_user)):
    logger.info(f"Handling /interview/chat request for stage: {req.current_stage}")
    from ai.interview_agent import run_interview_turn
    try:
        result = await run_interview_turn(
            persona_id=req.persona_id,
            current_stage=req.current_stage,
            target_position=req.target_position,
            cv_profile=req.cv_profile,
            message_history=req.message_history
        )
        return InterviewChatResponse(
            ai_message=result["ai_message"],
            next_stage=result["next_stage"],
            feedback_metadata=result.get("feedback_metadata", {})
        )
    except Exception as e:
        logger.error(f"Failed handling interview chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_tasks: Dict[str, asyncio.Task] = {}
        self.interrupt_events: Dict[str, asyncio.Event] = {}
        self.session_code: Dict[str, str] = {}
        self.session_history: Dict[str, List[Dict[str, str]]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.interrupt_events[session_id] = asyncio.Event()
        self.session_code[session_id] = ""
        self.session_history[session_id] = []

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.session_tasks:
            self.session_tasks[session_id].cancel()
            del self.session_tasks[session_id]
        if session_id in self.interrupt_events:
            del self.interrupt_events[session_id]
        if session_id in self.session_history:
            del self.session_history[session_id]

manager = ConnectionManager()

@app.websocket("/ws/interview/{session_id}")
async def websocket_interview(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    logger.info(f"WebSocket connected: {session_id}")
    
    session_data = None
    is_empty_history = True
    if supabase:
        def fetch_session():
            return supabase.table("interview_sessions").select("*").eq("id", session_id).execute()
        res = await asyncio.to_thread(fetch_session)
        if res.data:
            session_data = res.data[0]
            
        def fetch_trans():
            return supabase.table("interview_transcripts").select("*").eq("session_id", session_id).order("created_at").execute()
        trans_res = await asyncio.to_thread(fetch_trans)
        if trans_res.data:
            is_empty_history = False
            manager.session_history[session_id] = [
                {"role": "user" if m["message_owner"] == "user" else "assistant", "content": m["content"], "stage": m["stage"]}
                for m in trans_res.data
            ]
            
    if not session_data:
        await websocket.close(code=1008)
        return
        
    if is_empty_history and session_data.get("current_stage") != "Feedback":
        logger.info(f"Empty transcript history. Triggering initial AI greeting for {session_id}")
        manager.session_tasks[session_id] = asyncio.create_task(
            generate_and_stream_ai_response(session_id, websocket, session_data)
        )

    try:
        while True:
            message = await websocket.receive()
            
            if "bytes" in message:
                audio_data = message["bytes"]
                logger.info(f"Received audio chunk of {len(audio_data)} bytes for {session_id}")
                
                if session_id in manager.session_tasks and not manager.session_tasks[session_id].done():
                    manager.interrupt_events[session_id].set()
                
                try:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
                        tmp.write(audio_data)
                        tmp.flush()
                        tmp_path = tmp.name
                    
                    def run_whisper():
                        with open(tmp_path, "rb") as f:
                            return groq_client.audio.transcriptions.create(
                                file=(os.path.basename(tmp_path), f.read()),
                                model="whisper-large-v3",
                                prompt="Technical interview transcription."
                            )
                    transcription = await asyncio.to_thread(run_whisper)
                    os.unlink(tmp_path)
                    
                    user_text = transcription.text.strip()
                    if user_text:
                        logger.info(f"User transcribed: {user_text}")
                        await websocket.send_json({"type": "transcription", "text": user_text})
                        
                        if supabase:
                            def insert_user_msg():
                                return supabase.table("interview_transcripts").insert({
                                    "session_id": session_id,
                                    "message_owner": "user",
                                    "content": user_text,
                                    "stage": session_data.get("current_stage", "Intro")
                                }).execute()
                            await asyncio.to_thread(insert_user_msg)
                            
                        manager.session_history[session_id].append({
                            "role": "user",
                            "content": user_text,
                            "stage": session_data.get("current_stage", "Intro")
                        })
                        
                        manager.interrupt_events[session_id].clear()
                        manager.session_tasks[session_id] = asyncio.create_task(
                            generate_and_stream_ai_response(session_id, websocket, session_data)
                        )
                except Exception as e:
                    logger.error(f"Whisper transcription failed: {e}", exc_info=True)
                    
            elif "text" in message:
                data = json.loads(message["text"])
                msg_type = data.get("type")
                
                if msg_type == "code_update":
                    manager.session_code[session_id] = data.get("code", "")
                elif msg_type == "interrupt":
                    logger.info(f"Client requested interrupt for {session_id}")
                    if session_id in manager.session_tasks and not manager.session_tasks[session_id].done():
                        manager.interrupt_events[session_id].set()
                elif msg_type == "text_message":
                    user_text = data.get("text", "")
                    if user_text:
                        if supabase:
                            def insert_user_text():
                                return supabase.table("interview_transcripts").insert({
                                    "session_id": session_id,
                                    "message_owner": "user",
                                    "content": user_text,
                                    "stage": session_data.get("current_stage", "Intro")
                                }).execute()
                            await asyncio.to_thread(insert_user_text)
                        manager.session_history[session_id].append({
                            "role": "user",
                            "content": user_text,
                            "stage": session_data.get("current_stage", "Intro")
                        })
                        manager.interrupt_events[session_id].clear()
                        manager.session_tasks[session_id] = asyncio.create_task(
                            generate_and_stream_ai_response(session_id, websocket, session_data)
                        )

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
        manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id)

async def generate_and_stream_ai_response(session_id: str, websocket: WebSocket, session_data: dict):
    from ai.interview_agent import run_interview_stream
    
    cv_profile = {}
    if supabase and session_data.get("cv_variant_id"):
        try:
            def fetch_cv():
                return supabase.table("user_cv_variants").select("cv_profile").eq("id", session_data["cv_variant_id"]).execute()
            cv_res = await asyncio.to_thread(fetch_cv)
            if cv_res.data:
                cv_profile = cv_res.data[0].get("cv_profile", {})
        except Exception as e:
            logger.error(f"Error fetching CV variant: {e}")
            await websocket.send_json({"type": "error", "message": f"Database CV fetch error: {str(e)}"})
            return
            
    current_stage = session_data.get("current_stage", "Intro")
    
    try:
        async for chunk in run_interview_stream(
            persona_id=session_data.get("selected_persona", "mentor"),
            current_stage=current_stage,
            target_position=session_data.get("target_position", "Software Engineer"),
            cv_profile=cv_profile,
            message_history=manager.session_history.get(session_id, []),
            current_code=manager.session_code.get(session_id, ""),
            interrupt_event=manager.interrupt_events.get(session_id)
        ):
            await websocket.send_json(chunk)
            
            if chunk.get("type") == "final":
                next_stage = chunk.get("next_stage") or current_stage
                ai_text = chunk.get("ai_message", "")
                if ai_text and supabase:
                    def insert_ai_msg():
                        return supabase.table("interview_transcripts").insert({
                            "session_id": session_id,
                            "message_owner": "ai",
                            "content": ai_text,
                            "stage": next_stage,
                            "feedback_metadata": chunk.get("feedback_metadata", {})
                        }).execute()
                    await asyncio.to_thread(insert_ai_msg)
                    
                manager.session_history[session_id].append({
                    "role": "assistant",
                    "content": ai_text,
                    "stage": next_stage
                })
                
                if next_stage and next_stage != current_stage:
                    if supabase:
                        payload = {"current_stage": next_stage}
                        if next_stage == "Feedback":
                            payload["status"] = "completed"
                        def update_stage():
                            return supabase.table("interview_sessions").update(payload).eq("id", session_id).execute()
                        await asyncio.to_thread(update_stage)
                    session_data["current_stage"] = next_stage
                    
    except asyncio.CancelledError:
        logger.info("AI generation task cancelled.")
    except Exception as e:
        logger.error(f"Error streaming AI response: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass