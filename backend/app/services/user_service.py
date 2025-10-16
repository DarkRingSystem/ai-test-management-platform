from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from datetime import datetime

from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate, UserPasswordUpdate
from app.core.security import get_password_hash, verify_password
from app.core.encryption import (
    decrypt_password, encrypt_phone, decrypt_phone,
    encrypt_email, decrypt_email, encryption_manager
)


class UserService:
    """用户服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """根据ID获取用户"""
        user = self.db.query(User).filter(
            User.id == user_id,
            User.is_deleted == False
        ).first()

        # 解密敏感数据用于响应（添加异常处理）
        if user:
            if user.email:
                try:
                    user.email = decrypt_email(user.email)
                except Exception as e:
                    # 如果解密失败，说明数据可能未加密，保持原值
                    print(f"邮箱解密失败，保持原值: {e}")
                    pass
            if user.phone:
                try:
                    user.phone = decrypt_phone(user.phone)
                except Exception as e:
                    # 如果解密失败，说明数据可能未加密，保持原值
                    print(f"电话解密失败，保持原值: {e}")
                    pass

        return user
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        user = self.db.query(User).filter(
            User.username == username,
            User.is_deleted == False
        ).first()

        # 注意：这里不解密敏感数据，因为认证时需要保持加密状态进行数据库操作
        # 解密会在authenticate_user方法的最后进行
        return user
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        return self.db.query(User).filter(
            User.email == email,
            User.is_deleted == False
        ).first()
    
    def get_users(self, skip: int = 0, limit: int = 100, 
                  role: Optional[UserRole] = None,
                  status: Optional[UserStatus] = None,
                  search: Optional[str] = None) -> List[User]:
        """获取用户列表"""
        query = self.db.query(User).filter(User.is_deleted == False)
        
        if role:
            query = query.filter(User.role == role)
        
        if status:
            query = query.filter(User.status == status)
        
        if search:
            query = query.filter(
                or_(
                    User.username.contains(search),
                    User.full_name.contains(search),
                    User.email.contains(search)
                )
            )
        
        users = query.offset(skip).limit(limit).all()

        # 解密敏感数据用于响应
        for user in users:
            if user.email:
                user.email = decrypt_email(user.email)
            if user.phone:
                user.phone = decrypt_phone(user.phone)

        return users
    
    def create_user(self, user_data: UserCreate) -> User:
        """创建用户"""
        print(f"🔍 创建用户 - 接收到的数据: {user_data.dict()}")

        # 解密传输过来的敏感数据
        decrypted_password = decrypt_password(user_data.password)
        decrypted_email = decrypt_email(user_data.email)
        decrypted_phone = decrypt_phone(user_data.phone) if user_data.phone else None

        print(f"🔍 解密后的数据:")
        print(f"- 密码长度: {len(decrypted_password)}")
        print(f"- 邮箱: {decrypted_email}")
        print(f"- 电话: {decrypted_phone}")

        # 验证解密后的数据
        if len(decrypted_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="密码长度至少6位"
            )

        # 验证邮箱格式
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, decrypted_email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱格式不正确"
            )

        # 检查用户名是否已存在
        if self.get_user_by_username(user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )

        # 检查邮箱是否已存在（使用解密后的邮箱）
        if self.get_user_by_email(decrypted_email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已存在"
            )

        # 创建用户
        hashed_password = get_password_hash(decrypted_password)
        db_user = User(
            username=user_data.username,
            email=encrypt_email(decrypted_email),  # 存储时加密邮箱
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            phone=encrypt_phone(decrypted_phone) if decrypted_phone else None,  # 存储时加密电话
            avatar=user_data.avatar,
            role=user_data.role,
            status=user_data.status,
            description=user_data.description
        )

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        print(f"✅ 用户创建成功: {db_user.username}")

        # 返回时解密敏感数据用于响应
        db_user.email = decrypt_email(db_user.email)
        if db_user.phone:
            db_user.phone = decrypt_phone(db_user.phone)

        return db_user
    
    def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        """更新用户"""
        print(f"🔍 更新用户 - 用户ID: {user_id}, 数据: {user_data.dict()}")

        db_user = self.get_user_by_id(user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 更新字段
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'phone' and value:
                # 解密传输过来的电话号码，然后加密存储
                decrypted_phone = decrypt_phone(value)
                print(f"🔍 更新电话: {decrypted_phone}")
                setattr(db_user, field, encrypt_phone(decrypted_phone))
            else:
                setattr(db_user, field, value)

        self.db.commit()
        self.db.refresh(db_user)

        print(f"✅ 用户更新成功: {db_user.username}")

        # 返回时解密敏感数据用于响应
        if db_user.email:
            db_user.email = decrypt_email(db_user.email)
        if db_user.phone:
            db_user.phone = decrypt_phone(db_user.phone)

        return db_user
    
    def update_password(self, user_id: int, password_data: UserPasswordUpdate) -> bool:
        """更新用户密码"""
        db_user = self.get_user_by_id(user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 解密传输过来的密码
        decrypted_old_password = decrypt_password(password_data.old_password)
        decrypted_new_password = decrypt_password(password_data.new_password)

        # 验证旧密码
        if not verify_password(decrypted_old_password, db_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="旧密码错误"
            )
        
        # 更新密码
        db_user.hashed_password = get_password_hash(decrypted_new_password)
        self.db.commit()
        return True
    
    def delete_user(self, user_id: int) -> bool:
        """删除用户（软删除）"""
        db_user = self.get_user_by_id(user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 防止删除admin用户
        if db_user.username == 'admin':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不能删除admin用户"
            )

        db_user.is_deleted = True
        self.db.commit()
        return True
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """用户认证"""
        print(f"🔍 用户认证 - 用户名: {username}")

        # 解密传输过来的密码
        decrypted_password = decrypt_password(password)
        print(f"🔍 解密后密码长度: {len(decrypted_password)}")

        user = self.get_user_by_username(username)
        if not user:
            print(f"❌ 用户不存在: {username}")
            return None

        if not verify_password(decrypted_password, user.hashed_password):
            print(f"❌ 密码验证失败: {username}")
            return None

        if user.status != UserStatus.ACTIVE:
            print(f"❌ 用户状态不活跃: {username}, 状态: {user.status}")
            return None

        # 更新登录信息
        user.last_login = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        user.login_count = str(int(user.login_count) + 1)
        self.db.commit()

        print(f"✅ 用户认证成功: {username}")

        # 注意：登录认证时不解密敏感数据，因为登录响应不需要返回email和phone
        # 敏感数据的解密会在其他需要的地方进行（如用户管理页面）

        return user

    def authenticate_user_plain(self, username: str, password: str) -> Optional[User]:
        """用户认证（明文密码，用于测试）"""
        print(f"🔍 用户认证（明文） - 用户名: {username}")

        user = self.get_user_by_username(username)
        if not user:
            print(f"❌ 用户不存在: {username}")
            return None

        if not verify_password(password, user.hashed_password):
            print(f"❌ 密码验证失败: {username}")
            return None

        if user.status != UserStatus.ACTIVE:
            print(f"❌ 用户状态不活跃: {username}, 状态: {user.status}")
            return None

        # 更新登录信息
        user.last_login = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        user.login_count = str(int(user.login_count) + 1)
        self.db.commit()

        print(f"✅ 用户认证成功（明文）: {username}")
        return user
