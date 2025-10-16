from sqlalchemy import Column, String, Text, Enum, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class DefectSeverity(str, enum.Enum):
    """缺陷严重程度枚举"""
    BLOCKER = "blocker"           # 阻塞
    CRITICAL = "critical"         # 严重
    MAJOR = "major"               # 主要
    MINOR = "minor"               # 次要
    TRIVIAL = "trivial"           # 轻微


class DefectPriority(str, enum.Enum):
    """缺陷优先级枚举"""
    URGENT = "urgent"             # 紧急
    HIGH = "high"                 # 高
    MEDIUM = "medium"             # 中
    LOW = "low"                   # 低


class DefectStatus(str, enum.Enum):
    """缺陷状态枚举"""
    NEW = "new"                   # 新建
    ASSIGNED = "assigned"         # 已分配
    IN_PROGRESS = "in_progress"   # 处理中
    RESOLVED = "resolved"         # 已解决
    VERIFIED = "verified"         # 已验证
    CLOSED = "closed"             # 已关闭
    REJECTED = "rejected"         # 已拒绝
    REOPENED = "reopened"         # 重新打开


class DefectType(str, enum.Enum):
    """缺陷类型枚举"""
    FUNCTIONAL = "functional"      # 功能缺陷
    PERFORMANCE = "performance"    # 性能缺陷
    INTERFACE = "interface"        # 界面缺陷
    COMPATIBILITY = "compatibility"  # 兼容性缺陷
    SECURITY = "security"          # 安全缺陷
    USABILITY = "usability"        # 易用性缺陷
    DATA = "data"                  # 数据缺陷


class Defect(BaseModel):
    """缺陷模型"""
    __tablename__ = "defects"
    
    title = Column(String(200), nullable=False, comment="缺陷标题")
    code = Column(String(50), nullable=False, comment="缺陷编号")
    description = Column(Text, comment="缺陷描述")
    
    steps_to_reproduce = Column(Text, comment="重现步骤")
    expected_result = Column(Text, comment="预期结果")
    actual_result = Column(Text, comment="实际结果")
    
    severity = Column(Enum(DefectSeverity), default=DefectSeverity.MAJOR, comment="严重程度")
    priority = Column(Enum(DefectPriority), default=DefectPriority.MEDIUM, comment="优先级")
    status = Column(Enum(DefectStatus), default=DefectStatus.NEW, comment="缺陷状态")
    type = Column(Enum(DefectType), default=DefectType.FUNCTIONAL, comment="缺陷类型")
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, comment="项目ID")
    requirement_id = Column(Integer, ForeignKey("requirements.id"), comment="关联需求ID")
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), comment="关联测试用例ID")
    
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    assignee_id = Column(Integer, ForeignKey("users.id"), comment="负责人ID")
    
    environment = Column(String(100), comment="发现环境")
    version = Column(String(50), comment="发现版本")
    browser = Column(String(50), comment="浏览器")
    os = Column(String(50), comment="操作系统")
    
    found_date = Column(DateTime, comment="发现日期")
    resolved_date = Column(DateTime, comment="解决日期")
    verified_date = Column(DateTime, comment="验证日期")
    closed_date = Column(DateTime, comment="关闭日期")
    
    resolution = Column(Text, comment="解决方案")
    verification_notes = Column(Text, comment="验证说明")
    
    # 关联关系
    project = relationship("Project", back_populates="defects")
    requirement = relationship("Requirement")
    test_case = relationship("TestCase")
    creator = relationship("User", back_populates="created_defects", foreign_keys=[creator_id])
    assignee = relationship("User", back_populates="assigned_defects", foreign_keys=[assignee_id])
    
    comments = relationship("DefectComment", back_populates="defect", cascade="all, delete-orphan")
    attachments = relationship("DefectAttachment", back_populates="defect", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Defect(title='{self.title}', code='{self.code}', status='{self.status}')>"


class DefectComment(BaseModel):
    """缺陷评论模型"""
    __tablename__ = "defect_comments"
    
    defect_id = Column(Integer, ForeignKey("defects.id"), nullable=False, comment="缺陷ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="评论者ID")
    content = Column(Text, nullable=False, comment="评论内容")
    
    # 关联关系
    defect = relationship("Defect", back_populates="comments")
    user = relationship("User")
    
    def __repr__(self):
        return f"<DefectComment(defect_id={self.defect_id}, user_id={self.user_id})>"


class DefectAttachment(BaseModel):
    """缺陷附件模型"""
    __tablename__ = "defect_attachments"
    
    defect_id = Column(Integer, ForeignKey("defects.id"), nullable=False, comment="缺陷ID")
    filename = Column(String(255), nullable=False, comment="文件名")
    original_filename = Column(String(255), nullable=False, comment="原始文件名")
    file_path = Column(String(500), nullable=False, comment="文件路径")
    file_size = Column(Integer, comment="文件大小")
    content_type = Column(String(100), comment="文件类型")
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="上传者ID")
    
    # 关联关系
    defect = relationship("Defect", back_populates="attachments")
    uploader = relationship("User")
    
    def __repr__(self):
        return f"<DefectAttachment(filename='{self.filename}')>"
