import os
import sys

# add current dir
sys.path.append(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv('.env')

try:
    from routers.talentlens import get_supabase
    supabase = get_supabase()
    res = supabase.table("cv_submissions").select("id", count="exact").limit(1).execute()
    print("SUCCESS DB:", res)
except Exception as e:
    print("ERROR DB:", e)
