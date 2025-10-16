# 导入所有模型，确保SQLAlchemy能够发现它们
from .base import BaseModel
from .user import User, UserRole, UserStatus
from .project import Project, ProjectMember, ProjectStatus, ProjectPriority, ProjectMemberRole
from .requirement import Requirement, RequirementType, RequirementStatus, RequirementPriority
from .test_case import TestCase, TestExecution, TestCaseType, TestCasePriority, TestCaseStatus, TestExecutionStatus
from .test_plan import TestPlan, TestPlanStatus, TestPlanType, test_plan_cases
from .defect import Defect, DefectComment, DefectAttachment, DefectSeverity, DefectPriority, DefectStatus, DefectType

# 导出所有模型类
__all__ = [
    "BaseModel",
    "User", "UserRole", "UserStatus",
    "Project", "ProjectMember", "ProjectStatus", "ProjectPriority", "ProjectMemberRole",
    "Requirement", "RequirementType", "RequirementStatus", "RequirementPriority",
    "TestCase", "TestExecution", "TestCaseType", "TestCasePriority", "TestCaseStatus", "TestExecutionStatus",
    "TestPlan", "TestPlanStatus", "TestPlanType", "test_plan_cases",
    "Defect", "DefectComment", "DefectAttachment", "DefectSeverity", "DefectPriority", "DefectStatus", "DefectType"
]
