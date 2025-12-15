"""
Script to create/update admin user directly in database
Run this if the startup event doesn't work properly

Usage: python -m backend.create_admin
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import User
from backend import auth

def create_admin():
    db = SessionLocal()
    try:
        admin_email = "jamiksteam@gmail.com"
        admin_password = "Jamik1440$"
        
        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == admin_email).first()
        
        # Always update password hash to ensure it uses the current hashing scheme
        if admin_user:
            # Update existing admin user (always update password hash)
            admin_user.role = "admin"
            admin_user.is_active = True
            # Force password hash update to use current scheme
            admin_user.hashed_password = auth.get_password_hash(admin_password)
            print(f"✓ Admin user updated: {admin_email}")
            print(f"✓ Password hash updated to current scheme")
        else:
            # Create new admin user
            hashed_password = auth.get_password_hash(admin_password)
            admin_user = User(
                email=admin_email,
                hashed_password=hashed_password,
                full_name="Admin",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            print(f"✓ Admin user created: {admin_email}")
        
        db.commit()
        db.refresh(admin_user)
        print(f"✓ Admin user ID: {admin_user.id}")
        print(f"✓ Admin email: {admin_user.email}")
        print(f"✓ Admin role: {admin_user.role}")
        print(f"✓ Admin active: {admin_user.is_active}")
        print("\n✓ Admin initialization completed successfully!")
        print(f"\nLogin credentials:")
        print(f"  Email: {admin_email}")
        print(f"  Password: {admin_password}")
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()

