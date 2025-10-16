from sqlalchemy import Column, String, Text, Enum, Integer, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class TestPlanStatus(str, enum.Enum):
    """测试计划状态枚举"""
    DRAFT = "draft"               # 草稿
    ACTIVE = "active"             # 激活
    COMPLETED = "completed"       # 已完成
    CANCELLED = "cancelled"       # 已取消


class TestPlanType(str, enum.Enum):
    """测试计划类型枚举"""
    SYSTEM = "system"             # 系统测试
    INTEGRATION = "integration"   # 集成测试
    REGRESSION = "regression"     # 回归测试
    SMOKE = "smoke"               # 冒烟测试
    ACCEPTANCE = "acceptance"     # 验收测试


# 测试计划与测试用例的关联表
test_plan_cases = Table(
    'test_plan_cases',
    BaseModel.metadata,
    Column('test_plan_id', Integer, ForeignKey('test_plans.id'), primary_key=True),
    Column('test_case_id', Integer, ForeignKey('test_cases.id'), primary_key=True)
)


class TestPlan(BaseModel):
    """测试计划模型"""
    __tablename__ = "test_plans"
    
    name = Column(String(200), nullable=False, comment="计划名称")
    description = Column(Text, comment="计划描述")
    
    type = Column(Enum(TestPlanType), default=TestPlanType.SYSTEM, comment="计划类型")
    status = Column(Enum(TestPlanStatus), default=TestPlanStatus.DRAFT, comment="计划状态")
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, comment="项目ID")
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    
    start_date = Column(DateTime, comment="开始日期")
    end_date = Column(DateTime, comment="结束日期")
    
    environment = Column(String(100), comment="测试环境")
    version = Column(String(50), comment="测试版本")
    
    # 统计字段
    total_cases = Column(Integer, default=0, comment="总用例数")
    passed_cases = Column(Integer, default=0, comment="通过用例数")
    failed_cases = Column(Integer, default=0, comment="失败用例数")
    blocked_cases = Column(Integer, default=0, comment="阻塞用例数")
    skipped_cases = Column(Integer, default=0, comment="跳过用例数")
    
    # 关联关系
    project = relationship("Project", back_populates="test_plans")
    creator = relationship("User")
    
    test_cases = relationship("TestCase", secondary=test_plan_cases, backref="test_plans")
    executions = relationship("TestExecution", back_populates="test_plan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<TestPlan(name='{self.name}', status='{self.status}')>"
    
    @property
    def pass_rate(self):
        """通过率"""
        if self.total_cases == 0:
            return 0
        return round((self.passed_cases / self.total_cases) * 100, 2)
