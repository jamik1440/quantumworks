"""Test admin user login"""
from backend.database import SessionLocal
from backend.models import User
from backend import auth

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'jamiksteam@gmail.com').first()
    
    print('=== ADMIN USER CHECK ===')
    if user:
        print(f'Email: {user.email}')
        print(f'Role: {user.role}')
        print(f'Active: {user.is_active}')
        print(f'Hash scheme: {"pbkdf2" if user.hashed_password.startswith("$pbkdf2") else "bcrypt" if user.hashed_password.startswith("$2") else "unknown"}')
        print(f'Hash preview: {user.hashed_password[:50]}...')
        
        # Test password verification
        verify_result = auth.verify_password('Jamik1440$', user.hashed_password)
        print(f'Password verification: {verify_result}')
        
        if verify_result:
            print('✓ Login should work!')
        else:
            print('✗ Password verification FAILED!')
    else:
        print('✗ Admin user NOT FOUND!')
    print('=' * 30)
finally:
    db.close()

