from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator, computed_field
import os


class Settings(BaseSettings):
    # 应用基础配置
    APP_NAME: str = "API智能测试平台"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # PostgreSQL 数据库配置
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "testplatform"
    POSTGRES_PASSWORD: str = "testplatform123"
    POSTGRES_DB: str = "test_platform"
    POSTGRES_DATABASE_URL: Optional[str] = None
    POSTGRES_ASYNC_DATABASE_URL: Optional[str] = None

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """PostgreSQL数据库连接URL"""
        # 如果提供了完整的 URL，优先使用
        if self.POSTGRES_DATABASE_URL:
            return self.POSTGRES_DATABASE_URL
        # 否则根据配置项构建
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @computed_field
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """PostgreSQL异步数据库连接URL"""
        # 如果提供了完整的 URL，优先使用
        if self.POSTGRES_ASYNC_DATABASE_URL:
            return self.POSTGRES_ASYNC_DATABASE_URL
        # 否则根据配置项构建
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT配置
    SECRET_KEY: str = "your-secret-key-here-please-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 加密配置
    ENCRYPTION_KEY: str = "your-secret-key-for-frontend-encryption-2024"
    
    # CORS配置
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    
    # Celery配置
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # 邮件配置
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # 大模型配置
    API_KEY: Optional[str] = None
    MODEL_NAME: str = "deepseek-chat"
    BASE_URL: str = "https://api.deepseek.com/v1"

    # 视觉模型配置
    VISION_MODEL: str = "qwen-vl-max-latest"
    VISION_API_KEY: Optional[str] = None
    VISION_BASE_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"

    # UI-TARS 模型配置
    UITARS_MODEL: str = "doubao-1-5-ui-tars-250428"
    UITARS_API_KEY: Optional[str] = None
    UITARS_BASE_URL: str = "https://ark.cn-beijing.volces.com/api/v3"
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    model_config = {
        "env_file": os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        "case_sensitive": True,
        "extra": "ignore"  # 忽略额外的环境变量
    }


# 创建全局设置实例
settings = Settings()

# 确保上传目录存在
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
