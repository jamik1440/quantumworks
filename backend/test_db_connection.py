"""Test database connection and data"""
from backend.database import engine, SessionLocal
from backend.models import User, Project

def test_connection():
    print("=" * 50)
    print("DATABASE CONNECTION TEST")
    print("=" * 50)
    
    try:
        # Test connection
        db = SessionLocal()
        
        # Get counts
        users_count = db.query(User).count()
        projects_count = db.query(Project).count()
        
        print(f"✓ Database connected successfully")
        print(f"✓ Engine: {engine.url}")
        print(f"✓ Users in DB: {users_count}")
        print(f"✓ Projects in DB: {projects_count}")
        
        # Check admin user
        admin = db.query(User).filter(User.email == 'jamiksteam@gmail.com').first()
        if admin:
            print(f"✓ Admin user exists: {admin.email}")
            print(f"  - Role: {admin.role}")
            print(f"  - Active: {admin.is_active}")
            print(f"  - ID: {admin.id}")
        else:
            print("✗ Admin user NOT found")
        
        # List all users
        all_users = db.query(User).all()
        if all_users:
            print(f"\nAll users in database:")
            for u in all_users:
                print(f"  - {u.email} ({u.role}) - Active: {u.is_active}")
        
        # List all projects
        all_projects = db.query(Project).all()
        if all_projects:
            print(f"\nAll projects in database:")
            for p in all_projects:
                print(f"  - {p.title} (Status: {p.status})")
        
        print("\n" + "=" * 50)
        print("✓ All database tests passed!")
        print("=" * 50)
        
        db.close()
        return True
        
    except Exception as e:
        print(f"\n✗ Database connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_connection()

