from typing import List, Union
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os
load_dotenv()

class Settings(BaseSettings):
    # Application Configuration
    app_name: str = os.getenv("APP_NAME", "Job Tracker")
    app_version: str = os.getenv("APP_VERSION")
    debug: bool = os.getenv("DEBUG", False)

    # Database configuration
    database_url: str = os.getenv("DATABASE_URL")
    database_host: str = os.getenv("DATABASE_HOST")
    database_user: str = os.getenv("DATABASE_USER")
    database_pass: str = os.getenv("DATABASE_PASS")
    database_db: str = os.getenv("DATABASE_DB")
    database_port: int = os.getenv("DATABASE_PORT")

    # File storage configuration
    base_job_file_path: str = os.getenv("BASE_JOB_FILE_PATH")
    resume_dir: str = os.getenv("RESUME_DIR")
    cover_letter_dir: str = os.getenv("COVER_LETTER_DIR")

    # Logging configuration
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_file: str = os.getenv("LOG_FILE", "app.log")

    # CORS - Handle both string and list formats
    allowed_origins: Union[List[str], str] = os.getenv("ALLOWED_ORIGINS", "*")

    # AI Configuration
    ai_model: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    openai_api_key: str = os.getenv("OPENAI_API_KEY")
    openai_project: str = os.getenv("OPENAI_PROJECT")

    def get_allowed_origins(self) -> List[str]:
        if isinstance(self.allowed_origins, str):
            # Handle string format from environment variable
            import json
            try:
                return json.loads(self.allowed_origins)
            except json.JSONDecodeError:
                # Fallback to single origin
                return [self.allowed_origins]
        return self.allowed_origins

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
