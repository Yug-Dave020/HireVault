import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Mock dependencies to avoid actual auth/db/groq calls
@pytest.fixture(autouse=True)
def mock_dependencies(monkeypatch):
    # Mock current user for endpoints requiring authentication
    async def mock_get_current_user():
        return "test_user_id"
    
    # We patch the import in the main module where it is used
    monkeypatch.setattr("main.get_current_user", mock_get_current_user)
    
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_cv_init():
    # cv_init requires auth, so we pass a mock header (the mock will bypass actual verification if patched correctly)
    app.dependency_overrides[app.router.dependencies[0].dependency] = lambda: "test_user_id" if app.router.dependencies else None
    
    # Alternatively, simply call it. TestClient handles it if we override auth
    from auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: "test_user_id"
    
    response = client.post("/cv/init")
    assert response.status_code == 200
    data = response.json()
    assert "profile" in data
    assert "personal" in data["profile"]
    assert "experience" in data["profile"]
    
def test_cv_parse_invalid_file():
    from auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: "test_user_id"
    
    # Test uploading an unsupported file type
    response = client.post(
        "/cv/parse", 
        files={"file": ("test.png", b"fake image content", "image/png")}
    )
    assert response.status_code == 400
    assert "Only PDF and TXT files" in response.json()["detail"]
