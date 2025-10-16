#!/usr/bin/env python3
"""
数据库初始化脚本
创建数据库表和初始超级用户
"""

import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.models import User
from app.models.user import UserRole, UserStatus
from app.core.security import get_password_hash
from app.core.encryption import encrypt_email, encrypt_phone


def create_tables():
    """创建数据库表"""
    print("正在创建数据库表...")
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成")


def create_superuser():
    """创建超级用户"""
    print("正在创建超级用户...")
    
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 检查是否已存在超级用户
        existing_user = db.query(User).filter(User.username == "admin").first()
        if existing_user:
            print("超级用户已存在，跳过创建")
            return
        
        # 创建超级用户
        superuser = User(
            username="admin",
            email=encrypt_email("admin@example.com"),  # 加密邮箱
            hashed_password=get_password_hash("admin123"),
            full_name="系统管理员",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_superuser=True,
            description="系统默认超级用户"
        )
        
        db.add(superuser)
        db.commit()
        db.refresh(superuser)
        
        print(f"超级用户创建成功:")
        print(f"  用户名: {superuser.username}")
        print(f"  邮箱: {superuser.email}")
        print(f"  默认密码: admin123")
        print(f"  请及时修改默认密码!")
        
    except Exception as e:
        print(f"创建超级用户失败: {e}")
        db.rollback()
    finally:
        db.close()


def create_sample_users():
    """创建示例用户"""
    print("正在创建示例用户...")
    
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    sample_users = [
        {
            "username": "project_manager",
            "email": "pm@example.com",
            "password": "pm123456",
            "full_name": "项目经理",
            "role": UserRole.PROJECT_MANAGER,
            "description": "示例项目经理账户"
        },
        {
            "username": "test_manager",
            "email": "tm@example.com",
            "password": "tm123456",
            "full_name": "测试经理",
            "role": UserRole.TEST_MANAGER,
            "description": "示例测试经理账户"
        },
        {
            "username": "tester",
            "email": "tester@example.com",
            "password": "test123456",
            "full_name": "测试工程师",
            "role": UserRole.TESTER,
            "description": "示例测试工程师账户"
        },
        {
            "username": "developer",
            "email": "dev@example.com",
            "password": "dev123456",
            "full_name": "开发工程师",
            "role": UserRole.DEVELOPER,
            "description": "示例开发工程师账户"
        }
    ]
    
    try:
        for user_data in sample_users:
            # 检查用户是否已存在
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if existing_user:
                print(f"用户 {user_data['username']} 已存在，跳过创建")
                continue
            
            # 创建用户
            user = User(
                username=user_data["username"],
                email=encrypt_email(user_data["email"]),  # 加密邮箱
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                status=UserStatus.ACTIVE,
                description=user_data["description"]
            )
            
            db.add(user)
            print(f"创建用户: {user_data['username']} ({user_data['full_name']})")
        
        db.commit()
        print("示例用户创建完成")
        
    except Exception as e:
        print(f"创建示例用户失败: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """主函数"""
    print("开始初始化数据库...")
    
    # 创建数据库表
    create_tables()
    
    # 创建超级用户
    create_superuser()
    
    # 创建示例用户
    create_sample_users()
    
    print("数据库初始化完成!")


if __name__ == "__main__":
    main()
