import base64
import hashlib
from typing import Optional
from .config import settings


class EncryptionManager:
    """加密管理器 - 用于敏感数据的加密和解密，与前端简单加密兼容"""

    def __init__(self):
        self.secret_key = getattr(settings, 'ENCRYPTION_KEY', 'your-secret-key-for-frontend-encryption-2024')

    def encrypt(self, data: str) -> str:
        """简单加密字符串数据，与前端兼容"""
        if not data:
            return data

        try:
            # 简单的加密：Base64编码 + 密钥混淆
            combined = data + '|' + self.secret_key[:8]
            encoded = base64.b64encode(combined.encode('utf-8')).decode('utf-8')
            return encoded

        except Exception as e:
            print(f"加密失败: {e}")
            return data

    def decrypt(self, encrypted_data: str) -> str:
        """简单解密字符串数据，与前端兼容"""
        if not encrypted_data:
            return encrypted_data

        try:
            # 解码base64
            decoded = base64.b64decode(encrypted_data.encode('utf-8')).decode('utf-8')
            parts = decoded.split('|')

            if len(parts) == 2 and parts[1] == self.secret_key[:8]:
                return parts[0]
            return encrypted_data

        except Exception as e:
            print(f"解密失败: {e}")
            return encrypted_data
    
    def encrypt_sensitive_data(self, data: dict) -> dict:
        """加密敏感数据字段"""
        sensitive_fields = ['password', 'phone', 'email']
        encrypted_data = data.copy()
        
        for field in sensitive_fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt(str(encrypted_data[field]))
        
        return encrypted_data
    
    def decrypt_sensitive_data(self, data: dict) -> dict:
        """解密敏感数据字段"""
        sensitive_fields = ['phone', 'email']  # 密码不需要解密显示
        decrypted_data = data.copy()
        
        for field in sensitive_fields:
            if field in decrypted_data and decrypted_data[field]:
                decrypted_data[field] = self.decrypt(str(decrypted_data[field]))
        
        return decrypted_data


# 全局加密管理器实例
encryption_manager = EncryptionManager()


def encrypt_password(password: str) -> str:
    """加密密码（用于传输）"""
    return encryption_manager.encrypt(password)


def decrypt_password(encrypted_password: str) -> str:
    """解密密码（用于验证）"""
    return encryption_manager.decrypt(encrypted_password)


def encrypt_phone(phone: str) -> str:
    """加密电话号码"""
    return encryption_manager.encrypt(phone) if phone else phone


def decrypt_phone(encrypted_phone: str) -> str:
    """解密电话号码"""
    return encryption_manager.decrypt(encrypted_phone) if encrypted_phone else encrypted_phone


def encrypt_email(email: str) -> str:
    """加密邮箱"""
    return encryption_manager.encrypt(email) if email else email


def decrypt_email(encrypted_email: str) -> str:
    """解密邮箱"""
    return encryption_manager.decrypt(encrypted_email) if encrypted_email else encrypted_email


def hash_for_storage(data: str) -> str:
    """为存储生成哈希值（不可逆）"""
    return hashlib.sha256(data.encode('utf-8')).hexdigest()
