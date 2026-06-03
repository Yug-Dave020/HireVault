import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
from groq import Groq, AsyncGroq

logger = logging.getLogger("hirevault-worker")
groq_api_key = os.getenv("GROQ_API_KEY")
async_groq_client = AsyncGroq(api_key=groq_api_key) if groq_api_key else None

PERSONAS = {
    "mentor": {
        "name": "The Encouraging Mentor",
        "description": "Supportive, guides the user through roadblocks, provides constructive feedback, and encourages them to elaborate."
    },
    "hardliner": {
        "name": "The FAANG Hardliner",
        "description": "Strict, pedantic, drills into edge cases, challenges system design trade-offs, expects STAR method answers, and does not sugarcoat."
    }
}

STAGES = ["Intro", "Tech", "Behavioral", "Feedback"]

def compress_cv(cv_profile: dict) -> str:
    if not cv_profile:
        return "No CV provided."
    
    try:
        personal = cv_profile.get("personal", {})
        target_role = personal.get("target_role", "Candidate")
        
        skills = cv_profile.get("skills", {})
        tech_skills = skills.get("technical", []) if isinstance(skills, dict) else skills
        
        experience = cv_profile.get("experience", [])
        recent_roles = [f"{e.get('role', '')} at {e.get('company', '')}" for e in experience[:2]]
        
        projects = cv_profile.get("projects", [])
        recent_projects = [f"{p.get('name', '')}" for p in projects[:2]]
        
        compressed = f"Target Role: {target_role}\n"
        if tech_skills:
            compressed += f"Technical Skills: {', '.join(tech_skills) if isinstance(tech_skills, list) else tech_skills}\n"
        if recent_roles:
            compressed += f"Recent Experience: {', '.join(recent_roles)}\n"
        if recent_projects:
            compressed += f"Recent Projects: {', '.join(recent_projects)}\n"
            
        return compressed
    except Exception as e:
        logger.warning(f"Failed to compress CV, returning raw: {e}")
        return json.dumps(cv_profile, indent=2)[:1000]

def generate_system_prompt(persona_id: str, current_stage: str, target_position: str, cv_profile: dict, ai_msg_count: int, current_code: Optional[str] = None) -> str:
    persona = PERSONAS.get(persona_id, PERSONAS["mentor"])
    
    cv_summary = compress_cv(cv_profile)
    
    prompt = f"""You are an AI Interviewer conducting a mock interview for the position of '{target_position}'.
Your persona is '{persona['name']}': {persona['description']}

The candidate's CV profile (condensed):
{cv_summary}

We are currently in the '{current_stage}' stage of the interview.
"""
    if current_code and current_code.strip():
        prompt += f"\n[LIVE CODE EDITOR CONTEXT]: The candidate has written the following code in the shared sandbox. Review it if relevant to your question or answer:\n```\n{current_code}\n```\n"

    if current_stage == "Intro":
        prompt += f"\nFocus on welcoming the candidate and discussing their high-level background. You have asked {ai_msg_count} questions so far in the Intro stage."
        if ai_msg_count >= 1:
            prompt += " IMPORTANT: You have already asked enough introductory questions. You MUST set should_advance_stage to true to move to the Technical stage. Do not drag out the introduction."
        else:
            prompt += " Ask them to introduce themselves or ask a high-level background question."
    elif current_stage == "Tech":
        prompt += f"\nFocus on deep-diving into technical skills, languages, architectures, and framework entries found in their CV. You have asked {ai_msg_count} technical questions so far."
        if ai_msg_count >= 3:
            prompt += " IMPORTANT: You have asked enough technical questions. You MUST set should_advance_stage to true to move to the Behavioral stage."
        else:
            prompt += " Ask ONE challenging technical question relevant to the target role at a time. Refer to their written code if applicable."
    elif current_stage == "Behavioral":
        prompt += f"\nFocus on Behavioral Scenarios expecting the STAR method. You have asked {ai_msg_count} behavioral scenarios so far."
        if ai_msg_count >= 2:
            prompt += " IMPORTANT: You have asked enough behavioral questions. You MUST set should_advance_stage to true to move to the Feedback stage."
        else:
            prompt += " Ask ONE situational or behavioral question at a time to evaluate culture fit and problem-solving."
    elif current_stage == "Feedback":
        prompt += "\nThe interview has concluded. Provide a final evaluation, summarizing their strengths and areas for improvement based on the entire transcript. Do not ask more questions. set should_advance_stage to true."
        
    prompt += """
You must respond in JSON format with the exact following keys:
- "ai_message": Your conversational response to the candidate. Keep it concise, natural, and highly engaging. If in Feedback stage, this is your final detailed evaluation.
- "should_advance_stage": Set to true ONLY if the current stage feels complete and you are ready to transition to the next phase. False to continue digging deeper in the current stage.
- "feedback_metadata": Internal evaluation of their LAST answer. You MUST provide this for every single turn where the user provided an answer.

Use the following STRICT grading rubric for "feedback_metadata.score" (1-100):
- 0-20: The user says "I don't know", gives up, or gives a completely irrelevant answer.
- 21-50: The answer is fundamentally flawed, lacks any depth, or misses the core concept entirely.
- 51-75: The answer is partially correct but lacks specific examples, technical depth, or structure (like the STAR method).
- 76-100: The answer is excellent, highly detailed, technically accurate, and well-structured.

{
  "ai_message": "...",
  "should_advance_stage": false,
  "feedback_metadata": {
     "score": 85,
     "rationale": "Clear answer but lacked detail on X.",
     "ideal_answer": "An ideal answer would have covered Y and Z using the STAR method."
  }
}
"""
    return prompt

def get_prepared_messages(persona_id, current_stage, target_position, cv_profile, message_history, current_code=None):
    filtered_history = []
    has_previous = False
    ai_msg_count = 0
    
    for msg in message_history:
        msg_stage = msg.get("stage", current_stage)
        if msg_stage == current_stage:
            filtered_history.append({"role": msg["role"], "content": msg["content"]})
            if msg["role"] == "assistant":
                ai_msg_count += 1
        else:
            has_previous = True

    system_prompt = generate_system_prompt(persona_id, current_stage, target_position, cv_profile, ai_msg_count, current_code)
            
    if has_previous:
        summary_text = ""
        if current_stage == "Tech":
            summary_text = "Intro stage completed. Candidate successfully introduced themselves."
        elif current_stage == "Behavioral":
            summary_text = "Technical stage completed. Candidate successfully answered technical questions."
        elif current_stage == "Feedback":
            summary_text = "Behavioral stage completed. Candidate answered all situational scenarios."
            
        if summary_text:
            system_prompt += f"\n\n[SYSTEM NOTE: Previous stages are complete. {summary_text} Focus strictly on the {current_stage} stage.]"

    MAX_HISTORY = 6
    if len(filtered_history) > MAX_HISTORY:
        filtered_history = filtered_history[-MAX_HISTORY:]
    
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(filtered_history)
    return messages

async def run_interview_turn(
    persona_id: str,
    current_stage: str,
    target_position: str,
    cv_profile: dict,
    message_history: List[Dict[str, str]],
) -> Dict[str, Any]:
    
    if not async_groq_client:
        raise Exception("Async Groq client not initialized")
        
    messages = get_prepared_messages(persona_id, current_stage, target_position, cv_profile, message_history)
    
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    try:
        response = await async_groq_client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        parsed = json.loads(content)
        
        next_stage = current_stage
        if parsed.get("should_advance_stage") and current_stage in STAGES:
            current_idx = STAGES.index(current_stage)
            if current_idx < len(STAGES) - 1:
                next_stage = STAGES[current_idx + 1]
                
        return {
            "ai_message": parsed.get("ai_message", ""),
            "next_stage": next_stage,
            "feedback_metadata": parsed.get("feedback_metadata", {})
        }
    except Exception as e:
        logger.error(f"Interview agent failed: {e}")
        raise e

async def run_interview_stream(
    persona_id: str,
    current_stage: str,
    target_position: str,
    cv_profile: dict,
    message_history: List[Dict[str, str]],
    current_code: Optional[str] = None,
    interrupt_event: Optional[asyncio.Event] = None
) -> AsyncGenerator[Dict[str, Any], None]:
    
    if not async_groq_client:
        raise Exception("Async Groq client not initialized")
        
    messages = get_prepared_messages(persona_id, current_stage, target_position, cv_profile, message_history, current_code)
    
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    try:
        stream = await async_groq_client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=0.7,
            response_format={"type": "json_object"},
            stream=True
        )
        
        accumulated_json = ""
        in_ai_message = False
        ai_message_text = ""
        import re
        
        async for chunk in stream:
            if interrupt_event and interrupt_event.is_set():
                logger.info("Interrupt event detected. Aborting AI generation.")
                break
                
            delta = chunk.choices[0].delta.content
            if delta is not None:
                accumulated_json += delta
                
                match = re.search(r'"ai_message"\s*:\s*"((?:[^"\\]|\\.)*)', accumulated_json)
                if match:
                    raw_str = match.group(1)
                    raw_str = raw_str.replace('\\n', '\n').replace('\\"', '"').replace('\\t', '\t')
                    new_text = raw_str[len(ai_message_text):]
                    if new_text:
                        ai_message_text = raw_str
                        yield {"type": "text_delta", "content": new_text}
                
        try:
            parsed = json.loads(accumulated_json)
            next_stage = current_stage
            if parsed.get("should_advance_stage") and current_stage in STAGES:
                current_idx = STAGES.index(current_stage)
                if current_idx < len(STAGES) - 1:
                    next_stage = STAGES[current_idx + 1]
                    
            yield {
                "type": "final",
                "ai_message": parsed.get("ai_message", ""),
                "next_stage": next_stage,
                "feedback_metadata": parsed.get("feedback_metadata", {})
            }
        except json.JSONDecodeError:
            import re
            match = re.search(r'"ai_message"\s*:\s*"([^"]*)', accumulated_json)
            text = match.group(1) if match else accumulated_json
            # Strip JSON cruft if regex failed
            if "ai_message" in text and match is None:
                text = text.replace('{"ai_message":"', '').replace('"', '')
                
            yield {
                "type": "final",
                "ai_message": text + ("" if interrupt_event and not interrupt_event.is_set() else " - (Interrupted)"),
                "next_stage": current_stage,
                "feedback_metadata": {}
            }
            
    except Exception as e:
        logger.error(f"Interview streaming agent failed: {e}")
        yield {"type": "error", "error": str(e)}
