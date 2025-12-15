"""
Production logging configuration
Replaces all print() statements with proper structured logging
"""
import logging
import os
from logging.handlers import RotatingFileHandler
import sys

def setup_logging():
    """
    Configure production logging
    
    Features:
    - File rotation (10MB max, 5 backups)
    - Structured format with timestamps
    - Separate error log
    - Console output for systemd
    """
    
    log_level = os.getenv("LOG_LEVEL", "WARNING")
    log_file = os.getenv("LOG_FILE", "/var/log/quantumworks/app.log")
    error_log_file = os.getenv("ERROR_LOG_FILE", "/var/log/quantumworks/error.log")
    
    # Create logs directory
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.WARNING),
        format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
        handlers=[
            # Main log file (all levels)
            RotatingFileHandler(
                log_file,
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5,
                encoding='utf-8'
            ),
            # Error log file (errors only)
            RotatingFileHandler(
                error_log_file,
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5,
                encoding='utf-8'
            ),
            # Console handler (for systemd journal / docker logs)
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Configure error file handler to only log errors
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file,
        maxBytes=10*1024*1024,
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    logging.getLogger().addHandler(error_handler)
    
    # Quiet noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.ERROR)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    return logging.getLogger(__name__)

# Initialize logger
logger = setup_logging()

# Example usage:
# logger.info("User logged in", extra={"user_id": 123})
# logger.error("Login failed", exc_info=True, extra={"email": "user@example.com"})
# logger.warning("Rate limit exceeded", extra={"ip": "1.2.3.4"})
# logger.critical("Database connection lost!")
