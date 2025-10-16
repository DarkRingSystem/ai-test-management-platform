from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.core.config import settings
from app.schemas.user import UserLogin, Token, LoginToken, User as UserSchema, UserLoginResponse
from app.services.user_service import UserService
from app.utils.deps import get_current_active_user

router = APIRouter()


@router.post("/login", response_model=Token, summary="用户登录")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    用户登录接口
    
    - **username**: 用户名
    - **password**: 密码
    """
    user_service = UserService(db)
    user = user_service.authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user
    }


@router.post("/login/json", response_model=LoginToken, summary="JSON格式登录")
async def login_json(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    JSON格式用户登录接口

    - **username**: 用户名
    - **password**: 密码
    """
    user_service = UserService(db)
    user = user_service.authenticate_user(login_data.username, login_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username},
        expires_delta=access_token_expires
    )

    # 创建登录响应用户对象（不包含敏感信息）
    login_user = UserLoginResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        avatar=user.avatar,
        role=user.role,
        status=user.status,
        is_superuser=user.is_superuser,
        last_login=user.last_login,
        login_count=user.login_count,
        created_at=user.created_at,
        updated_at=user.updated_at,
        description=user.description
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": login_user
    }


@router.post("/login/test", response_model=LoginToken, summary="测试登录接口")
async def login_test(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    测试用登录接口，不使用加密

    - **username**: 用户名
    - **password**: 密码（明文）
    """
    user_service = UserService(db)
    # 直接使用明文密码认证
    user = user_service.authenticate_user_plain(login_data.username, login_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username},
        expires_delta=access_token_expires
    )

    # 创建登录响应用户对象（不包含敏感信息）
    login_user = UserLoginResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        avatar=user.avatar,
        role=user.role,
        status=user.status,
        is_superuser=user.is_superuser,
        last_login=user.last_login,
        login_count=user.login_count,
        created_at=user.created_at,
        updated_at=user.updated_at,
        description=user.description
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": login_user
    }


@router.get("/me", response_model=UserSchema, summary="获取当前用户信息")
async def get_current_user_info(
    current_user: UserSchema = Depends(get_current_active_user)
):
    """
    获取当前登录用户的信息
    """
    return current_user


@router.post("/refresh", response_model=LoginToken, summary="刷新令牌")
async def refresh_token(
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    刷新访问令牌
    """
    # 创建新的访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(current_user.id), "username": current_user.username},
        expires_delta=access_token_expires
    )

    # 创建登录响应用户对象（不包含敏感信息）
    login_user = UserLoginResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        avatar=current_user.avatar,
        role=current_user.role,
        status=current_user.status,
        is_superuser=current_user.is_superuser,
        last_login=current_user.last_login,
        login_count=current_user.login_count,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        description=current_user.description
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": login_user
    }
