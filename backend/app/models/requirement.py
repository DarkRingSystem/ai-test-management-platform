from sqlalchemy import Column, String, Text, Enum, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class RequirementType(str, enum.Enum):
    """需求类型枚举"""
    FUNCTIONAL = "functional"      # 功能需求
    NON_FUNCTIONAL = "non_functional"  # 非功能需求
    INTERFACE = "interface"        # 接口需求
    PERFORMANCE = "performance"    # 性能需求
    SECURITY = "security"          # 安全需求
    USABILITY = "usability"        # 可用性需求


class RequirementStatus(str, enum.Enum):
    """需求状态枚举"""
    DRAFT = "draft"               # 草稿
    REVIEW = "review"             # 评审中
    APPROVED = "approved"         # 已批准
    REJECTED = "rejected"         # 已拒绝
    IMPLEMENTED = "implemented"   # 已实现
    TESTED = "tested"             # 已测试
    CLOSED = "closed"             # 已关闭


class RequirementPriority(str, enum.Enum):
    """需求优先级枚举"""
    LOW = "low"                   # 低
    MEDIUM = "medium"             # 中
    HIGH = "high"                 # 高
    CRITICAL = "critical"         # 关键


class Requirement(BaseModel):
    """需求模型"""
    __tablename__ = "requirements"
    
    title = Column(String(200), nullable=False, comment="需求标题")
    code = Column(String(50), nullable=False, comment="需求编号")
    description = Column(Text, comment="需求描述")
    acceptance_criteria = Column(Text, comment="验收标准")
    
    type = Column(Enum(RequirementType), default=RequirementType.FUNCTIONAL, comment="需求类型")
    status = Column(Enum(RequirementStatus), default=RequirementStatus.DRAFT, comment="需求状态")
    priority = Column(Enum(RequirementPriority), default=RequirementPriority.MEDIUM, comment="需求优先级")
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, comment="项目ID")
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    assignee_id = Column(Integer, ForeignKey("users.id"), comment="负责人ID")
    
    parent_id = Column(Integer, ForeignKey("requirements.id"), comment="父需求ID")
    
    estimated_hours = Column(Integer, comment="预估工时")
    actual_hours = Column(Integer, comment="实际工时")
    
    start_date = Column(DateTime, comment="开始日期")
    due_date = Column(DateTime, comment="截止日期")
    completed_date = Column(DateTime, comment="完成日期")
    
    # 关联关系
    project = relationship("Project", back_populates="requirements")
    creator = relationship("User", back_populates="created_requirements", foreign_keys=[creator_id])
    assignee = relationship("User", back_populates="assigned_requirements", foreign_keys=[assignee_id])
    
    parent = relationship("Requirement", remote_side="Requirement.id", backref="children")
    test_cases = relationship("TestCase", back_populates="requirement")
    
    def __repr__(self):
        return f"<Requirement(title='{self.title}', code='{self.code}')>"
