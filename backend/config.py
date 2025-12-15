"""
Production-safe configuration with feature flags and validation
"""
import os
from typing import Dict, Any

class Config:
    """Production-safe configuration with feature flags"""
    
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # Critical validation
    if ENVIRONMENT == "production" and DEBUG:
        raise ValueError("🚨 DEBUG mode NOT allowed in production!")
    
    # Feature flags (defensive defaults)
    FEATURES: Dict[str, bool] = {
        "admin_endpoints": os.getenv("ENABLE_ADMIN_ENDPOINTS", "false").lower() == "true",
        "websocket": os.getenv("ENABLE_WEBSOCKET", "false").lower() == "true",
        "ai_features": os.getenv("ENABLE_AI_FEATURES", "true").lower() == "true",
        "user_registration": os.getenv("ENABLE_USER_REGISTRATION", "true").lower() == "true",
        "profile_uploads": os.getenv("ENABLE_PROFILE_UPLOADS", "false").lower() == "true",
        "direct_messages": os.getenv("ENABLE_DIRECT_MESSAGES", "false").lower() == "true",
        "payments": os.getenv("ENABLE_PAYMENTS", "false").lower() == "true",
        "web3_sync": os.getenv("ENABLE_WEB3_SYNC", "false").lower() == "true",
    }
    
    # Emergency controls
    MAINTENANCE_MODE = os.getenv("MAINTENANCE_MODE", "false").lower() == "true"
    EMERGENCY_SHUTDOWN = os.getenv("EMERGENCY_SHUTDOWN", "false").lower() == "true"
    
    # Rate limits (conservative production defaults)
    RATE_LIMITS = {
        "login": (int(os.getenv("RATE_LIMIT_LOGIN_MAX", 3)), 
                  int(os.getenv("RATE_LIMIT_LOGIN_WINDOW", 300))),
        "register": (int(os.getenv("RATE_LIMIT_REGISTER_MAX", 2)), 
                     int(os.getenv("RATE_LIMIT_REGISTER_WINDOW", 3600))),
        "ai": (int(os.getenv("RATE_LIMIT_AI_MAX", 5)), 
               int(os.getenv("RATE_LIMIT_AI_WINDOW", 3600))),
        "global": (int(os.getenv("RATE_LIMIT_GLOBAL_MAX", 100)), 
                   int(os.getenv("RATE_LIMIT_GLOBAL_WINDOW", 60))),
    }
    
    # Token lifetimes (shortened for production safety)
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 1))
    
    @classmethod
    def is_feature_enabled(cls, feature: str) -> bool:
        """Check if a feature is enabled"""
        return cls.FEATURES.get(feature, False)
    
    @classmethod
    def validate_production_config(cls):
        """Validate production configuration - raises ValueError if invalid"""
        if cls.ENVIRONMENT != "production":
            return
        
        errors = []
        
        # Check SECRET_KEY
        secret_key = os.getenv("SECRET_KEY", "")
        if not secret_key or len(secret_key) < 32:
            errors.append("SECRET_KEY not set or too short (min 32 chars)")
        
        if secret_key in ["CHANGE_THIS", "CHANGE_THIS_TO_A_RANDOM_SECRET_KEY"]:
            errors.append("SECRET_KEY is using default value - MUST CHANGE!")
        
        # Check CORS
        allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
        if "*" in allowed_origins:
            errors.append("ALLOWED_ORIGINS cannot contain wildcard (*) in production!")
        
        if not allowed_origins or allowed_origins.strip() == "":
            errors.append("ALLOWED_ORIGINS must be set in production")
        
        # Check database
        database_url = os.getenv("DATABASE_URL", "")
        if "sqlite" in database_url.lower():
            errors.append("SQLite not allowed in production - use PostgreSQL!")
        
        if not database_url:
            errors.append("DATABASE_URL must be set in production")
        
        # Check for exposed Gemini API key from .env.example
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        if gemini_key == "AIzaSyBb-w3Bs71vGQCQfLzHSOOl-p8pMs7L-8g":
            errors.append("🚨 EXPOSED Gemini API key detected! This key was in .env.example - MUST ROTATE!")
        
        # Check admin credentials
        admin_password = os.getenv("ADMIN_PASSWORD", "")
        if admin_password in ["CHANGE_THIS", "CHANGE_THIS_TO_A_STRONG_PASSWORD", ""]:
            errors.append("ADMIN_PASSWORD must be changed from default!")
        
        # Check monitoring
        if not os.getenv("SENTRY_DSN"):
            errors.append("⚠️  SENTRY_DSN not set - error tracking disabled!")
        
        if errors:
            error_msg = "Production configuration validation FAILED:\n" + "\n".join(f"  ❌ {e}" for e in errors)
            raise ValueError(error_msg)
        
        print("✓ Production configuration validated successfully")
        print(f"✓ Environment: {cls.ENVIRONMENT}")
        print(f"✓ Features enabled: {[k for k, v in cls.FEATURES.items() if v]}")
        print(f"✓ Emergency controls: Maintenance={cls.MAINTENANCE_MODE}, Shutdown={cls.EMERGENCY_SHUTDOWN}")

config = Config()
