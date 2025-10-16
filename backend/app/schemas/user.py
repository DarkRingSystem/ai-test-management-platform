from typing import Optional
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from app.models.user import UserRole, UserStatus
from app.core.encryption import decrypt_password, decrypt_email, decrypt_phone


class UserBase(BaseModel):
    """用户基础模式"""
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    role: UserRole = UserRole.TESTER
    status: UserStatus = UserStatus.ACTIVE
    description: Optional[str] = None


class UserCreate(BaseModel):
    """用户创建模式 - 接收加密数据"""
    username: str
    email: str  # 接收加密的邮箱
    password: str  # 接收加密的密码
    full_name: Optional[str] = None
    phone: Optional[str] = None  # 接收加密的电话
    avatar: Optional[str] = None
    role: UserRole = UserRole.TESTER
    status: UserStatus = UserStatus.ACTIVE
    description: Optional[str] = None

    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('用户名长度至少3位')
        if not v.replace('_', '').isalnum():
            raise ValueError('用户名只能包含字母、数字和下划线')
        return v


class UserUpdate(BaseModel):
    """用户更新模式"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    description: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    """用户密码更新模式"""
    old_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('新密码长度至少6位')
        return v


class UserInDB(UserBase):
    """数据库中的用户模式"""
    id: int
    is_superuser: bool = False
    last_login: Optional[str] = None
    login_count: str = "0"
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
    
    class Config:
        from_attributes = True


class User(UserInDB):
    """用户响应模式"""
    pass


class UserLoginResponse(BaseModel):
    """登录响应用户模式 - 不包含敏感信息"""
    id: int
    username: str
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    role: UserRole = UserRole.TESTER
    status: UserStatus = UserStatus.ACTIVE
    is_superuser: bool = False
    last_login: Optional[str] = None
    login_count: str = "0"
    created_at: datetime
    updated_at: datetime
    description: Optional[str] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """用户登录模式"""
    username: str
    password: str


class Token(BaseModel):
    """令牌模式"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: User


class LoginToken(BaseModel):
    """登录令牌模式 - 用户信息不包含敏感数据"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserLoginResponse


class TokenData(BaseModel):
    """令牌数据模式"""
    user_id: Optional[int] = None
    username: Optional[str] = None
