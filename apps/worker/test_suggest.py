import asyncio, os, json
from dotenv import load_dotenv
load_dotenv()
from groq import Groq
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
SUGGESTION_SYSTEM_PROMPT = """
You are an elite corporate technical recruiter and expert ATS (Applicant Tracking System) optimization assistant.
Your goal is to cross-examine a candidate's CV information against their target professional role and target job description to maximize their interview conversion rate.

Analyze the provided inputs with a focus on:
1. The Action-Result Framework: Rewriting descriptions to lead with crisp verbs and showcase numerical business impacts.
2. Skill Deficit Matching: Comparing their complete CV skill matrix against the provided Job Description to pinpoint missing industry keywords or technologies they should include.
3. Clarity and Density: Eliminating buzzwords, fluff phrases, and passive language.

You MUST return a JSON object with the exact following keys:
{
  "score": 0,
  "critiques": [],
  "optimized_suggestions": [],
  "recommended_skills": []
}
"""
user_payload = {'section_being_edited': 'global_gap_analysis', 'current_input_text': 'Software Engineer', 'target_role': 'Software Engineer', 'target_job_description': 'Not Provided', 'current_full_cv_data': {}, 'algorithmic_keyword_match_baseline': 0}
try:
    response = groq_client.chat.completions.create(
        messages=[
            {'role': 'system', 'content': SUGGESTION_SYSTEM_PROMPT},
            {'role': 'user', 'content': f'Analyze and optimize the following payload context:\n\n{json.dumps(user_payload, indent=2)}'}
        ],
        model='llama-3.1-8b-instant',
        temperature=0.2,
        response_format={'type': 'json_object'}
    )
    print(response.choices[0].message.content)
except Exception as e:
    print('ERROR:', e)
