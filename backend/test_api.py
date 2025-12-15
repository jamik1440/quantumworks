import requests
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    try:
        resp = requests.get(f"{BASE_URL}/health")
        if resp.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {resp.status_code}")
    except Exception as e:
        print(f"❌ Health check connection failed: {e}")

def test_register_and_login():
    email = f"test_{import_time()}@example.com"
    password = "strongpassword123"
    fullname = "Test User"
    
    # Register
    print(f"Testing registration for {email}...")
    reg_payload = {
        "email": email,
        "password": password,
        "full_name": fullname,
        "role": "freelancer"
    }
    
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    
    if reg_resp.status_code == 200:
        print("✅ Registration passed")
    else:
        print(f"❌ Registration failed: {reg_resp.text}")
        return

    # Login
    print("Testing login...")
    login_payload = {
        "email": email,
        "password": password
    }
    
    login_resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    
    if login_resp.status_code == 200:
        print("✅ Login passed")
        token = login_resp.json().get("access_token")
        
        # Verify Token
        verify_resp = requests.get(f"{BASE_URL}/users/me", headers={"Authorization": f"Bearer {token}"})
        if verify_resp.status_code == 200:
            user_data = verify_resp.json()
            if user_data['email'] == email and user_data['role'] == 'freelancer':
                print("✅ Token verification & User data passed")
            else:
                print(f"❌ User data mismatch: {user_data}")
        else:
            print(f"❌ Token verification failed: {verify_resp.text}")
            
    else:
        print(f"❌ Login failed: {login_resp.text}")

def import_time():
    import time
    return int(time.time())

if __name__ == "__main__":
    test_health()
    test_register_and_login()
