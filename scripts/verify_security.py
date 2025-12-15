#!/usr/bin/env python3
"""
Security Verification Script
Checks if all security settings are properly configured
"""
import os
import sys
from pathlib import Path

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_path = Path(".env")
    
    if not env_path.exists():
        return False, ".env file not found. Copy .env.example to .env"
    
    # Read .env file
    with open(env_path, encoding='utf-8') as f:
        env_content = f.read()
    
    required_vars = [
        "SECRET_KEY",
        "ADMIN_EMAIL",
        "ADMIN_PASSWORD",
        "GEMINI_API_KEY"
    ]
    
    missing_vars = []
    
    for var in required_vars:
        if var not in env_content:
            missing_vars.append(var)
    
    if missing_vars:
        return False, f"Missing variables: {', '.join(missing_vars)}"
    
    return True, ".env file properly configured"

def check_gitignore():
    """Check if .env is in .gitignore"""
    gitignore_path = Path(".gitignore")
    
    if not gitignore_path.exists():
        return False, ".gitignore file not found"
    
    with open(gitignore_path) as f:
        gitignore_content = f.read()
    
    if ".env" not in gitignore_content:
        return False, ".env not found in .gitignore"
    
    return True, ".env properly ignored by Git"

def check_secret_key_strength():
    """Check if SECRET_KEY is strong enough"""
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        secret_key = os.getenv("SECRET_KEY")
        
        if not secret_key:
            return False, "SECRET_KEY not set"
        
        if len(secret_key) < 32:
            return False, f"SECRET_KEY too short ({len(secret_key)} chars, need 32+)"
        
        if "CHANGE" in secret_key or "your-secret" in secret_key.lower():
            return False, "SECRET_KEY appears to be a default value"
        
        return True, f"SECRET_KEY is strong ({len(secret_key)} chars)"
    except Exception as e:
        return False, f"Error checking SECRET_KEY: {e}"

def check_middleware_files():
    """Check if all middleware files exist"""
    middleware_dir = Path("backend/middleware")
    
    if not middleware_dir.exists():
        return False, "backend/middleware directory not found"
    
    required_files = [
        "rate_limiter.py",
        "brute_force_protection.py",
        "ai_protection.py",
        "security_monitor.py",
        "__init__.py"
    ]
    
    missing_files = []
    for file in required_files:
        if not (middleware_dir / file).exists():
            missing_files.append(file)
    
    if missing_files:
        return False, f"Missing middleware files: {', '.join(missing_files)}"
    
    return True, "All middleware files present"

def check_hardcoded_credentials():
    """Check for hardcoded credentials in main.py"""
    main_py = Path("backend/main.py")
    
    if not main_py.exists():
        return False, "backend/main.py not found"
    
    try:
        with open(main_py, encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        # Try with different encoding
        try:
            with open(main_py, encoding='latin-1') as f:
                content = f.read()
        except Exception as e:
            return False, f"Error reading file: {e}"
    
    # Check for hardcoded credentials
    suspicious_patterns = [
        'admin_email = "jamiksteam',
        'admin_password = "Jamik',
        'SECRET_KEY = "your-secret',
    ]
    
    found_issues = []
    for pattern in suspicious_patterns:
        if pattern in content:
            found_issues.append(pattern)
    
    if found_issues:
        return False, f"Found hardcoded credentials: {len(found_issues)} issues"
    
    return True, "No hardcoded credentials found"

def main():
    """Run all security checks"""
    print("\n" + "="*60)
    print("🔒 SECURITY VERIFICATION")
    print("="*60 + "\n")
    
    checks = [
        ("Environment File", check_env_file),
        (".gitignore Configuration", check_gitignore),
        ("SECRET_KEY Strength", check_secret_key_strength),
        ("Middleware Files", check_middleware_files),
        ("Hardcoded Credentials", check_hardcoded_credentials),
    ]
    
    all_passed = True
    results = []
    
    for check_name, check_func in checks:
        try:
            passed, message = check_func()
            status = "✅" if passed else "❌"
            results.append((status, check_name, message))
            
            if not passed:
                all_passed = False
        except Exception as e:
            results.append(("❌", check_name, f"Error: {e}"))
            all_passed = False
    
    # Print results
    for status, name, message in results:
        print(f"{status} {name}")
        print(f"   {message}\n")
    
    print("="*60)
    
    if all_passed:
        print("✅ ALL SECURITY CHECKS PASSED!")
        print("\nYour application is properly secured. You can now:")
        print("1. Start the backend: python -m uvicorn backend.main:app --reload")
        print("2. Start the frontend: npm run dev")
        print("="*60 + "\n")
        return 0
    else:
        print("❌ SOME SECURITY CHECKS FAILED!")
        print("\nPlease fix the issues above before running the application.")
        print("\nQuick fixes:")
        print("1. Copy .env.example to .env")
        print("2. Generate SECRET_KEY: python -c \"import secrets; print(secrets.token_urlsafe(64))\"")
        print("3. Update .env with your values")
        print("4. Run this script again to verify")
        print("="*60 + "\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
