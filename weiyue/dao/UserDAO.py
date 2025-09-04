from db.base import Database
from db.models import (
    DefaultReason, RecoveryReason, CustomerInfo,
    DefaultApplication, RecoveryApplication, UserInfo,
    dict_to_model
)
from datetime import datetime

class UserDAO:
    """用户信息数据访问对象"""
    
    @staticmethod
    def get_by_id(user_id):
        """根据ID获取用户信息"""
        db = Database()
        try:
            sql = "SELECT * FROM t_user_info WHERE user_id = %s"
            success, msg = db.execute(sql, (user_id,))
            if success:
                row = db.fetchone()
                return dict_to_model(row, UserInfo)
            return None
        finally:
            db.close()
    
    @staticmethod
    def verify_user(username, password):
        """验证用户登录信息"""
        db = Database()
        try:
            sql = "SELECT * FROM t_user_info WHERE user_name = %s AND password = %s"
            success, msg = db.execute(sql, (username, password))
            if success:
                row = db.fetchone()
                return dict_to_model(row, UserInfo)
            return None
        finally:
            db.close()
    
    @staticmethod
    def create(user_info):
        """创建新用户"""
        db = Database()
        try:
            sql = """
                INSERT INTO t_user_info 
                (user_id, user_name, real_name, department, role, password, create_time, phone, email) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                user_info.user_id,
                user_info.user_name,
                user_info.real_name,
                user_info.department,
                user_info.role,
                user_info.password,
                user_info.create_time,
                user_info.phone,
                user_info.email
            )
            success, msg = db.execute(sql, values)
            return success
        finally:
            db.close()
