from sqlalchemy import Column, String, Boolean, Enum, Text
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class UserRole(str, enum.Enum):
    """用户角色枚举"""
    ADMIN = "admin"          # 系统管理员
    PROJECT_MANAGER = "project_manager"  # 项目经理
    TEST_MANAGER = "test_manager"        # 测试经理
    TESTER = "tester"        # 测试工程师
    DEVELOPER = "developer"  # 开发工程师
    VIEWER = "viewer"        # 只读用户


class UserStatus(str, enum.Enum):
    """用户状态枚举"""
    ACTIVE = "active"        # 激活
    INACTIVE = "inactive"    # 未激活
    SUSPENDED = "suspended"  # 暂停
    LOCKED = "locked"        # 锁定


class User(BaseModel):
    """用户模型"""
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    email = Column(String(100), unique=True, index=True, nullable=False, comment="邮箱")
    hashed_password = Column(String(255), nullable=False, comment="密码哈希")
    full_name = Column(String(100), comment="真实姓名")
    phone = Column(String(100), comment="手机号")
    avatar = Column(String(255), comment="头像URL")
    
    role = Column(Enum(UserRole), default=UserRole.TESTER, comment="用户角色")
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, comment="用户状态")
    
    is_superuser = Column(Boolean, default=False, comment="是否超级用户")
    last_login = Column(String(50), comment="最后登录时间")
    login_count = Column(String(10), default="0", comment="登录次数")
    
    description = Column(Text, comment="用户描述")
    
    # 关联关系
    created_projects = relationship("Project", back_populates="creator", foreign_keys="Project.creator_id")
    assigned_projects = relationship("ProjectMember", back_populates="user")
    created_requirements = relationship("Requirement", back_populates="creator", foreign_keys="Requirement.creator_id")
    assigned_requirements = relationship("Requirement", back_populates="assignee", foreign_keys="Requirement.assignee_id")
    created_test_cases = relationship("TestCase", back_populates="creator", foreign_keys="TestCase.creator_id")
    assigned_test_cases = relationship("TestCase", back_populates="assignee", foreign_keys="TestCase.assignee_id")
    created_defects = relationship("Defect", back_populates="creator", foreign_keys="Defect.creator_id")
    assigned_defects = relationship("Defect", back_populates="assignee", foreign_keys="Defect.assignee_id")
    
    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"
