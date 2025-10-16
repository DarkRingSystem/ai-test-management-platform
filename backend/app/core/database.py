from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# PostgreSQL 数据库引擎参数
engine_kwargs = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG,
    "pool_size": 10,
    "max_overflow": 20,
    "pool_recycle": 3600
}

# 同步数据库引擎
engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

# PostgreSQL 异步数据库引擎配置
async_engine_kwargs = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG,
    "pool_size": 10,
    "max_overflow": 20
}

# 异步数据库引擎
async_engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    **async_engine_kwargs
)

# 会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
AsyncSessionLocal = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

# 基础模型类
Base = declarative_base()


# 依赖注入：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 异步依赖注入：获取异步数据库会话
async def get_async_db():
    async with AsyncSessionLocal() as session:
        yield session
