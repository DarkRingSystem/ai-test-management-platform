from datetime import datetime
from typing import Optional, List
from pydantic import Field
from sqlalchemy import Column, String, Text, Enum, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from autogen_agentchat.messages import BaseMessage
from app.models.base import BaseModel

import enum


class TestCaseType(str, enum.Enum):
    """测试用例类型枚举"""
    FUNCTIONAL = "functional"      # 功能测试
    INTERFACE = "interface"        # 接口测试
    PERFORMANCE = "performance"    # 性能测试
    SECURITY = "security"          # 安全测试
    USABILITY = "usability"        # 可用性测试
    COMPATIBILITY = "compatibility"  # 兼容性测试
    REGRESSION = "regression"      # 回归测试


class TestCasePriority(str, enum.Enum):
    """测试用例优先级枚举"""
    LOW = "low"                   # 低
    MEDIUM = "medium"             # 中
    HIGH = "high"                 # 高
    CRITICAL = "critical"         # 关键


class TestCaseStatus(str, enum.Enum):
    """测试用例状态枚举"""
    DRAFT = "draft"               # 草稿
    REVIEW = "review"             # 评审中
    APPROVED = "approved"         # 已批准
    DEPRECATED = "deprecated"     # 已废弃


class TestCase(BaseModel):
    """测试用例模型"""
    __tablename__ = "test_cases"
    
    title = Column(String(200), nullable=False, comment="用例标题")
    code = Column(String(50), nullable=False, comment="用例编号")
    description = Column(Text, comment="用例描述")
    
    preconditions = Column(Text, comment="前置条件")
    test_steps = Column(Text, comment="测试步骤")
    expected_result = Column(Text, comment="预期结果")
    test_data = Column(Text, comment="测试数据")
    
    type = Column(Enum(TestCaseType), default=TestCaseType.FUNCTIONAL, comment="用例类型")
    priority = Column(Enum(TestCasePriority), default=TestCasePriority.MEDIUM, comment="用例优先级")
    status = Column(Enum(TestCaseStatus), default=TestCaseStatus.DRAFT, comment="用例状态")
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, comment="项目ID")
    requirement_id = Column(Integer, ForeignKey("requirements.id"), comment="关联需求ID")
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    assignee_id = Column(Integer, ForeignKey("users.id"), comment="负责人ID")
    
    is_automated = Column(Boolean, default=False, comment="是否自动化")
    automation_script = Column(Text, comment="自动化脚本")
    
    estimated_time = Column(Integer, comment="预估执行时间(分钟)")
    
    # 关联关系
    project = relationship("Project", back_populates="test_cases")
    requirement = relationship("Requirement", back_populates="test_cases")
    creator = relationship("User", back_populates="created_test_cases", foreign_keys=[creator_id])
    assignee = relationship("User", back_populates="assigned_test_cases", foreign_keys=[assignee_id])
    
    executions = relationship("TestExecution", back_populates="test_case", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<TestCase(title='{self.title}', code='{self.code}')>"


class TestExecutionStatus(str, enum.Enum):
    """测试执行状态枚举"""
    PENDING = "pending"           # 待执行
    RUNNING = "running"           # 执行中
    PASSED = "passed"             # 通过
    FAILED = "failed"             # 失败
    BLOCKED = "blocked"           # 阻塞
    SKIPPED = "skipped"           # 跳过


class TestExecution(BaseModel):
    """测试执行记录模型"""
    __tablename__ = "test_executions"
    
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False, comment="测试用例ID")
    test_plan_id = Column(Integer, ForeignKey("test_plans.id"), comment="测试计划ID")
    executor_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="执行者ID")
    
    status = Column(Enum(TestExecutionStatus), default=TestExecutionStatus.PENDING, comment="执行状态")
    actual_result = Column(Text, comment="实际结果")
    comments = Column(Text, comment="执行备注")
    
    start_time = Column(DateTime, comment="开始时间")
    end_time = Column(DateTime, comment="结束时间")
    execution_time = Column(Integer, comment="执行时长(秒)")
    
    environment = Column(String(100), comment="测试环境")
    version = Column(String(50), comment="测试版本")
    
    # 关联关系
    test_case = relationship("TestCase", back_populates="executions")
    test_plan = relationship("TestPlan", back_populates="executions")
    executor = relationship("User")
    
    def __repr__(self):
        return f"<TestExecution(test_case_id={self.test_case_id}, status='{self.status}')>"

class TestCaseData(BaseMessage):
    """测试用例数据模型"""
    title: str = Field(..., description="用例标题")
    code: Optional[str] = Field(None, description="用例编号")
    description: Optional[str] = Field(None, description="用例描述")
    preconditions: Optional[str] = Field(None, description="前置条件")
    test_steps: Optional[str] = Field(None, description="测试步骤")
    expected_result: Optional[str] = Field(None, description="预期结果")
    test_data: Optional[str] = Field(None, description="测试数据")
    type: Optional[TestCaseType] = Field(TestCaseType.FUNCTIONAL, description="用例类型")
    priority: Optional[TestCasePriority] = Field(TestCasePriority.MEDIUM, description="用例优先级")

class VideoAnalysisRequest(BaseMessage):
    video_name: str = Field(..., description="视频名称")
    video_path: str = Field(..., description="视频路径")
    video_type: Optional[str] = Field(None, description="视频类型")
    video_description: Optional[str] = Field(None, description="视频描述")
    analysis_target: Optional[str] = Field(None, description="分析目标")

class ImageAnalysisRequest(BaseMessage):
    image_name: str = Field(..., description="图片名称")
    image_path: str = Field(..., description="图片路径")
    image_type: Optional[str] = Field(None, description="图片类型")
    image_description: Optional[str] = Field(None, description="图片描述")
    analysis_target: Optional[str] = Field(None, description="分析目标")

class TestCaseGenerationRequest(BaseMessage):
    """测试用例智能体请求"""
    source_type: str = Field(..., description="来源类型")
    source_data: dict = Field(..., description="来源数据")
    test_cases: List[TestCaseData] = Field(..., description="测试用例数据")
    generation_config: dict = Field(default_factory=dict, description="生成配置")

class ImageAnalysisResponse(BaseMessage):
    """图片分析响应"""
    session_id: Optional[str] = Field(..., description="会话ID")
    image_name: str = Field(..., description="图片名称")
    image_id: str = Field(..., description="图片ID")
    analysis_result: dict = Field(..., description="分析结果")
    test_cases: List[TestCaseData] = Field(..., description="测试用例数据")
    processing_time: Optional[float] = Field(..., description="处理时间")
    created_at: Optional[datetime] = Field(..., description="创建时间")
