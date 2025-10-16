from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import User, UserCreate, UserUpdate, UserPasswordUpdate
from app.models.user import UserRole, UserStatus
from app.services.user_service import UserService
from app.utils.deps import get_current_active_user, get_current_superuser, require_roles

router = APIRouter()


@router.get("/", response_model=List[User], summary="获取用户列表")
async def get_users(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    role: Optional[UserRole] = Query(None, description="用户角色筛选"),
    status: Optional[UserStatus] = Query(None, description="用户状态筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
):
    """
    获取用户列表
    
    需要管理员或项目经理权限
    """
    user_service = UserService(db)
    users = user_service.get_users(
        skip=skip, 
        limit=limit, 
        role=role, 
        status=status, 
        search=search
    )
    return users


@router.post("/", response_model=User, summary="创建用户")
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    创建新用户
    
    需要管理员权限
    """
    user_service = UserService(db)
    return user_service.create_user(user_data)


@router.get("/{user_id}", response_model=User, summary="获取用户详情")
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取指定用户的详细信息
    
    用户只能查看自己的信息，管理员可以查看所有用户信息
    """
    user_service = UserService(db)
    
    # 检查权限：用户只能查看自己的信息，除非是管理员
    if user_id != current_user.id and not current_user.is_superuser and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return user


@router.put("/{user_id}", response_model=User, summary="更新用户信息")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    更新用户信息
    
    用户可以更新自己的基本信息，管理员可以更新所有用户信息
    """
    user_service = UserService(db)
    
    # 检查权限
    if user_id != current_user.id and not current_user.is_superuser and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    # 非管理员用户不能修改角色和状态
    if user_id == current_user.id and not current_user.is_superuser and current_user.role != UserRole.ADMIN:
        user_data.role = None
        user_data.status = None
    
    return user_service.update_user(user_id, user_data)


@router.put("/{user_id}/password", summary="更新用户密码")
async def update_user_password(
    user_id: int,
    password_data: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    更新用户密码
    
    用户只能修改自己的密码
    """
    # 检查权限：用户只能修改自己的密码
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只能修改自己的密码"
        )
    
    user_service = UserService(db)
    user_service.update_password(user_id, password_data)
    
    return {"message": "密码更新成功"}


@router.delete("/{user_id}", summary="删除用户")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    删除用户（软删除）
    
    需要管理员权限
    """
    # 不能删除自己
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己的账户"
        )
    
    user_service = UserService(db)
    user_service.delete_user(user_id)
    
    return {"message": "用户删除成功"}
