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
    database_host: str = os.getenv("POSTGRES_HOST")
    database_user: str = os.getenv("POSTGRES_USER")
    database_pass: str = os.getenv("POSTGRES_PASSWORD")
    database_db: str = os.getenv("POSTGRES_DB")
    database_port: int = os.getenv("POSTGRES_PORT")

    # File storage configuration
    base_job_file_path: str = os.getenv("BASE_JOB_FILE_PATH")
    resume_dir: str = os.getenv("RESUME_DIR")
    cover_letter_dir: str = os.getenv("COVER_LETTER_DIR")
    export_dir: str = os.getenv("EXPORT_DIR")

    # Logging configuration
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_file: str = os.getenv("LOG_FILE", "app.log")

    # CORS - Handle both string and list formats
    allowed_origins: Union[List[str], str] = os.getenv("ALLOWED_ORIGINS", "*")

    # AI Configuration
    ai_model: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    openai_api_key: str = os.getenv("OPENAI_API_KEY")
    openai_project: str = os.getenv("OPENAI_PROJECT")

    # LLM Settings from database (defaults)
    job_extract_llm: str = "gpt-4o-mini"
    rewrite_llm: str = "gpt-4o-mini"
    cover_llm: str = "gpt-4o-mini"

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

    def load_llm_settings_from_db(self, db):
        """
        Load LLM settings from the personal table in the database.
        Updates the settings object with the database values if they exist.
        """
        from sqlalchemy import text
        try:
            query = text("""
                SELECT job_extract_llm, rewrite_llm, cover_llm
                FROM personal
                LIMIT 1
            """)
            result = db.execute(query).first()

            if result:
                if result.job_extract_llm:
                    self.job_extract_llm = result.job_extract_llm
                if result.rewrite_llm:
                    self.rewrite_llm = result.rewrite_llm
                if result.cover_llm:
                    self.cover_llm = result.cover_llm
        except Exception:
            # If there's an error querying the DB, use defaults
            pass

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
