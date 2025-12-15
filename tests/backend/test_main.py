from unittest.mock import patch, MagicMock
from backend import models

def test_read_main(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_register_user(client, db_session):
    """Test user registration flow"""
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "full_name": "New User",
            "role": "employer"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    
    # Verify DB
    user = db_session.query(models.User).filter(models.User.email == "newuser@example.com").first()
    assert user is not None

def test_login_user(client, normal_user):
    """Test login flow"""
    # Note: normal_user fixture has password 'hashed_secret' but we need to know the raw password
    # For this test, we rely on the implementation of verify_password which uses passlib
    # Since we manually inserted 'hashed_secret' in fixture, login will likely fail unless we mock auth.verify_password
    # OR we create a user properly via endpoint
    
    # Let's clean register first to ensure we know the password
    client.post(
        "/auth/register",
        json={"email": "login@test.com", "password": "password123", "role": "freelancer"}
    )
    
    response = client.post(
        "/auth/login",
        json={"email": "login@test.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_create_project_unauthorized(client):
    """Try to create project without token"""
    response = client.post("/projects/", json={"title": "Test"})
    assert response.status_code == 401

def test_ai_task_parse_mocked(client, auth_header):
    """Test AI endpoint with mocked Gemini response"""
    mock_response = {
        "extracted_data": {"title": "Mocked Project", "skills": ["Python"]},
        "budget_estimate": {"range": "$500"},
        "timeline_estimate": {},
        "missing_information": [],
        "confidence_score": 0.95,
        "needs_clarification": False
    }

    # Patch the service call
    with patch("backend.services.task_assistant_service.TaskAssistantService.parse_user_input") as mock_parse:
        mock_parse.return_value = mock_response
        
        response = client.post(
            "/ai/task/parse",
            json={"user_input": "I need a website"},
            headers=auth_header
        )
        
        assert response.status_code == 200
        assert response.json()["extracted_data"]["title"] == "Mocked Project"
