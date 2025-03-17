# config.py
from pydantic import BaseSettings
from functools import lru_cache
import os
from typing import Dict, Any

class Settings(BaseSettings):
    # General settings
    app_name: str = "DERIV Flow Tracker"
    debug: bool = True
    status_update_interval: int = 120  # seconds
    
    # Directories
    config_dir: str = "configs"
    
    # Secret key for token generation
    secret_key: str = os.environ.get("SECRET_KEY", "development_secret_key")
    
    # Default database settings (will be overridden by flow configs)
    aws_db_host: str = os.environ.get("AWS_DB_HOST", "localhost")
    aws_db_user: str = os.environ.get("AWS_DB_USER", "")
    aws_db_password: str = os.environ.get("AWS_DB_PASSWORD", "")
    aws_db_name: str = os.environ.get("AWS_DB_NAME", "")
    
    oracle_db_host: str = os.environ.get("ORACLE_DB_HOST", "localhost")
    oracle_db_user: str = os.environ.get("ORACLE_DB_USER", "")
    oracle_db_password: str = os.environ.get("ORACLE_DB_PASSWORD", "")
    oracle_db_service: str = os.environ.get("ORACLE_DB_SERVICE", "")
    
    class Config:
        env_file = ".env"
        
@lru_cache()
def get_settings():
    return Settings()
