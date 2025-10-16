from sqlalchemy import Column, String, Text, Enum, Integer, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class ProjectStatus(str, enum.Enum):
    """项目状态枚举"""
    PLANNING = "planning"      # 规划中
    ACTIVE = "active"          # 进行中
    ON_HOLD = "on_hold"        # 暂停
    COMPLETED = "completed"    # 已完成
    CANCELLED = "cancelled"    # 已取消


class ProjectPriority(str, enum.Enum):
    """项目优先级枚举"""
    LOW = "low"               # 低
    MEDIUM = "medium"         # 中
    HIGH = "high"             # 高
    URGENT = "urgent"         # 紧急


class Project(BaseModel):
    """项目模型"""
    __tablename__ = "projects"
    
    name = Column(String(200), nullable=False, comment="项目名称")
    code = Column(String(50), unique=True, nullable=False, comment="项目编码")
    description = Column(Text, comment="项目描述")
    
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING, comment="项目状态")
    priority = Column(Enum(ProjectPriority), default=ProjectPriority.MEDIUM, comment="项目优先级")
    
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    start_date = Column(DateTime, comment="开始日期")
    end_date = Column(DateTime, comment="结束日期")
    
    # 统计字段
    requirement_count = Column(Integer, default=0, comment="需求数量")
    test_case_count = Column(Integer, default=0, comment="测试用例数量")
    defect_count = Column(Integer, default=0, comment="缺陷数量")
    
    # 关联关系
    creator = relationship("User", back_populates="created_projects", foreign_keys=[creator_id])
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    requirements = relationship("Requirement", back_populates="project", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="project", cascade="all, delete-orphan")
    defects = relationship("Defect", back_populates="project", cascade="all, delete-orphan")
    test_plans = relationship("TestPlan", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project(name='{self.name}', code='{self.code}')>"


class ProjectMemberRole(str, enum.Enum):
    """项目成员角色枚举"""
    MANAGER = "manager"        # 项目经理
    TEST_LEAD = "test_lead"    # 测试负责人
    TESTER = "tester"          # 测试工程师
    DEVELOPER = "developer"    # 开发工程师
    ANALYST = "analyst"        # 业务分析师
    VIEWER = "viewer"          # 观察者


class ProjectMember(BaseModel):
    """项目成员模型"""
    __tablename__ = "project_members"
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, comment="项目ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    role = Column(Enum(ProjectMemberRole), default=ProjectMemberRole.TESTER, comment="项目角色")
    joined_at = Column(DateTime, comment="加入时间")
    
    # 关联关系
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="assigned_projects")
    
    def __repr__(self):
        return f"<ProjectMember(project_id={self.project_id}, user_id={self.user_id}, role='{self.role}')>"
