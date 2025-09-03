from db.dao import UserDAO
from .base_service import BaseService
import hashlib

class UserService(BaseService):
    """用户服务，处理用户认证和信息查询"""
    
    def get_user_by_id(self, user_id):
        """根据ID获取用户信息"""
        try:
            return UserDAO.get_by_id(user_id)
        except Exception as e:
            self.logger.error(f"获取用户 {user_id} 信息失败: {str(e)}")
            return None
    
    def login(self, username, password):
        """用户登录验证"""
        try:
            # 实际应用中应该使用更安全的加密方式
            encrypted_password = self.encrypt_password(password)
            return UserDAO.verify_user(username, encrypted_password)
        except Exception as e:
            self.logger.error(f"用户 {username} 登录失败: {str(e)}")
            return None
    
    def encrypt_password(self, password):
        """密码加密处理"""
        # 实际应用中应该添加盐值并使用更安全的算法
        return hashlib.md5(password.encode()).hexdigest()
