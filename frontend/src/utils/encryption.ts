// 简单的Base64编码加密（用于演示，生产环境应使用更强的加密）
/**
 * 前端加密工具类
 * 用于敏感数据的加密和解密
 */
class EncryptionManager {
  private secretKey: string;

  constructor() {
    // 使用固定的密钥，在生产环境中应该从环境变量获取
    this.secretKey = 'your-secret-key-for-frontend-encryption-2024';
  }

  /**
   * 简单加密字符串（Base64 + 简单混淆）
   */
  encrypt(data: string): string {
    if (!data) return data;

    try {
      // 简单的加密：Base64编码 + 密钥混淆
      const combined = data + '|' + this.secretKey.substring(0, 8);
      const encoded = btoa(unescape(encodeURIComponent(combined)));
      return encoded;
    } catch (error) {
      console.error('加密失败:', error);
      return data;
    }
  }

  /**
   * 简单解密字符串
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;

    try {
      const decoded = decodeURIComponent(escape(atob(encryptedData)));
      const parts = decoded.split('|');
      if (parts.length === 2 && parts[1] === this.secretKey.substring(0, 8)) {
        return parts[0];
      }
      return encryptedData;
    } catch (error) {
      console.error('解密失败:', error);
      return encryptedData;
    }
  }

  /**
   * 加密敏感数据对象
   */
  encryptSensitiveData(data: any): any {
    const sensitiveFields = ['password', 'phone', 'email', 'old_password', 'new_password'];
    const encryptedData = { ...data };

    sensitiveFields.forEach(field => {
      if (encryptedData[field]) {
        encryptedData[field] = this.encrypt(String(encryptedData[field]));
      }
    });

    return encryptedData;
  }

  /**
   * 解密敏感数据对象
   */
  decryptSensitiveData(data: any): any {
    const sensitiveFields = ['phone', 'email']; // 密码不需要解密显示
    const decryptedData = { ...data };

    sensitiveFields.forEach(field => {
      if (decryptedData[field]) {
        decryptedData[field] = this.decrypt(String(decryptedData[field]));
      }
    });

    return decryptedData;
  }
}

// 创建全局实例
const encryptionManager = new EncryptionManager();

/**
 * 加密密码
 */
export const encryptPassword = (password: string): string => {
  return encryptionManager.encrypt(password);
};

/**
 * 加密电话号码
 */
export const encryptPhone = (phone: string): string => {
  return encryptionManager.encrypt(phone);
};

/**
 * 解密电话号码
 */
export const decryptPhone = (encryptedPhone: string): string => {
  return encryptionManager.decrypt(encryptedPhone);
};

/**
 * 加密邮箱
 */
export const encryptEmail = (email: string): string => {
  return encryptionManager.encrypt(email);
};

/**
 * 解密邮箱
 */
export const decryptEmail = (encryptedEmail: string): string => {
  return encryptionManager.decrypt(encryptedEmail);
};

/**
 * 加密登录数据
 */
export const encryptLoginData = (loginData: { username: string; password: string }) => {
  return {
    username: loginData.username, // 用户名不加密
    password: encryptPassword(loginData.password)
  };
};

/**
 * 加密用户创建数据
 */
export const encryptUserCreateData = (userData: any) => {
  return encryptionManager.encryptSensitiveData(userData);
};

/**
 * 加密用户更新数据
 */
export const encryptUserUpdateData = (userData: any) => {
  return encryptionManager.encryptSensitiveData(userData);
};

/**
 * 加密密码更新数据
 */
export const encryptPasswordUpdateData = (passwordData: { old_password: string; new_password: string }) => {
  return {
    old_password: encryptPassword(passwordData.old_password),
    new_password: encryptPassword(passwordData.new_password)
  };
};

/**
 * 解密用户数据（用于显示）
 */
export const decryptUserData = (userData: any) => {
  return encryptionManager.decryptSensitiveData(userData);
};

export default encryptionManager;
