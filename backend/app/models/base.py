from sqlalchemy import Column, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class BaseModel(Base):
    """基础模型类，包含通用字段"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    is_deleted = Column(Boolean, default=False, comment="是否删除")
    
    def to_dict(self):
        """转换为字典"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
