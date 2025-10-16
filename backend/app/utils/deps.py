from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User, UserRole
from app.services.user_service import UserService

# HTTP Bearer认证
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """获取当前用户"""
    try:
        print(f"🔍 get_current_user Debug:")
        print(f"- Credentials received: {credentials is not None}")
        if credentials:
            print(f"- Scheme: {credentials.scheme}")
            print(f"- Token preview: {credentials.credentials[:20]}...")

        # 验证令牌
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        print(f"- Token payload: {payload}")
        print(f"- User ID: {user_id}")

        if user_id is None:
            print("❌ No user ID in token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证凭据",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        print(f"❌ Exception in get_current_user: {e}")
        print(f"❌ Exception type: {type(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 获取用户信息
    user_service = UserService(db)
    user = user_service.get_user_by_id(int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """获取当前活跃用户"""
    if current_user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户未激活"
        )
    return current_user


def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    """获取当前超级用户"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    return current_user


def require_role(required_role: UserRole):
    """要求特定角色的装饰器"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role != required_role and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"需要{required_role.value}角色权限"
            )
        return current_user
    return role_checker


def require_roles(required_roles: list[UserRole]):
    """要求多个角色之一的装饰器"""
    def roles_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in required_roles and not current_user.is_superuser:
            role_names = [role.value for role in required_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"需要以下角色之一：{', '.join(role_names)}"
            )
        return current_user
    return roles_checker
