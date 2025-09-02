from db.base import Database
from db.models import (
    DefaultReason, RecoveryReason, CustomerInfo,
    DefaultApplication, RecoveryApplication, UserInfo,
    dict_to_model
)
from datetime import datetime

class DefaultReasonDAO:
    """违约原因数据访问对象"""
    
    @staticmethod
    def get_all_enabled():
        """获取所有启用的违约原因"""
        db = Database()
        try:
            sql = "SELECT * FROM t_default_reason WHERE is_enabled = 1 ORDER BY create_time DESC"
            success, msg = db.execute(sql)
            if success:
                results = db.fetchall()
                return [dict_to_model(row, DefaultReason) for row in results]
            return []
        finally:
            db.close()
    
    @staticmethod
    def get_by_id(reason_id):
        """根据ID获取违约原因"""
        db = Database()
        try:
            sql = "SELECT * FROM t_default_reason WHERE reason_id = %s"
            success, msg = db.execute(sql, (reason_id,))
            if success:
                row = db.fetchone()
                return dict_to_model(row, DefaultReason)
            return None
        finally:
            db.close()


class RecoveryReasonDAO:
    """重生原因数据访问对象"""
    
    @staticmethod
    def get_all_enabled():
        """获取所有启用的重生原因"""
        db = Database()
        try:
            sql = "SELECT * FROM t_recovery_reason WHERE is_enabled = 1 ORDER BY create_time DESC"
            success, msg = db.execute(sql)
            if success:
                results = db.fetchall()
                return [dict_to_model(row, RecoveryReason) for row in results]
            return []
        finally:
            db.close()
    
    @staticmethod
    def get_by_id(reason_id):
        """根据ID获取重生原因"""
        db = Database()
        try:
            sql = "SELECT * FROM t_recovery_reason WHERE recovery_id = %s"
            success, msg = db.execute(sql, (reason_id,))
            if success:
                row = db.fetchone()
                return dict_to_model(row, RecoveryReason)
            return None
        finally:
            db.close()


class CustomerDAO:
    """客户信息数据访问对象"""
    
    @staticmethod
    def get_by_id(customer_id):
        """根据ID获取客户信息"""
        db = Database()
        try:
            sql = "SELECT * FROM t_customer_info WHERE customer_id = %s"
            success, msg = db.execute(sql, (customer_id,))
            if success:
                row = db.fetchone()
                return dict_to_model(row, CustomerInfo)
            return None
        finally:
            db.close()
    
    @staticmethod
    def update_default_status(customer_id, is_default):
        """更新客户违约状态"""
        db = Database()
        try:
            sql = """
            UPDATE t_customer_info 
            SET is_default = %s, update_time = %s 
            WHERE customer_id = %s
            """
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            success, msg = db.execute(sql, (is_default, now, customer_id))
            if success:
                db.commit()
                return True
            db.rollback()
            return False
        finally:
            db.close()


class DefaultApplicationDAO:
    """违约认定申请数据访问对象"""
    
    @staticmethod
    def create(application):
        """创建违约认定申请"""
        db = Database()
        try:
            sql = """
            INSERT INTO t_default_application 
            (app_id, customer_id, default_reason_id, severity_level, remarks,
             attachment_url, applicant_id, apply_time, audit_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                application.app_id,
                application.customer_id,
                application.default_reason_id,
                application.severity_level,
                application.remarks,
                application.attachment_url,
                application.applicant_id,
                application.apply_time,
                application.audit_status
            )
            
            success, msg = db.execute(sql, params)
            if success:
                db.commit()
                return True
            db.rollback()
            return False
        finally:
            db.close()
    
    @staticmethod
    def get_by_id(app_id):
        """根据ID获取违约申请"""
        db = Database()
        try:
            sql = "SELECT * FROM t_default_application WHERE app_id = %s"
            success, msg = db.execute(sql, (app_id,))
            if success:
                row = db.fetchone()
                return dict_to_model(row, DefaultApplication)
            return None
        finally:
            db.close()
    
    @staticmethod
    def update_audit_status(app_id, auditor_id, audit_status, audit_remarks):
        """更新违约申请审核状态"""
        db = Database()
        try:
            sql = """
            UPDATE t_default_application 
            SET auditor_id = %s, audit_status = %s, audit_remarks = %s, audit_time = %s
            WHERE app_id = %s
            """
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            success, msg = db.execute(sql, (auditor_id, audit_status, audit_remarks, now, app_id))
            if success:
                db.commit()
                return True
            db.rollback()
            return False
        finally:
            db.close()


class RecoveryApplicationDAO:
    """重生申请数据访问对象"""
    
    @staticmethod
    def create(application):
        """创建重生申请"""
        db = Database()
        try:
            sql = """
            INSERT INTO t_recovery_application 
            (recovery_app_id, customer_id, original_default_app_id, recovery_reason_id,
             applicant_id, apply_time, audit_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                application.recovery_app_id,
                application.customer_id,
                application.original_default_app_id,
                application.recovery_reason_id,
                application.applicant_id,
                application.apply_time,
                application.audit_status
            )
            
            success, msg = db.execute(sql, params)
            if success:
                db.commit()
                return True
            db.rollback()
            return False
        finally:
            db.close()
    
    @staticmethod
    def get_by_id(app_id):
        """根据ID获取重生申请"""
        db = Database()
        try:
            sql = "SELECT * FROM t_recovery_application WHERE recovery_app_id = %s"
            success, msg = db.execute(sql, (app_id,))
            if success:
                row = db.fetchone()
                return dict_to_model(row, RecoveryApplication)
            return None
        finally:
            db.close()
    
    @staticmethod
    def update_audit_status(app_id, auditor_id, audit_status, audit_remarks):
        """更新重生申请审核状态"""
        db = Database()
        try:
            sql = """
            UPDATE t_recovery_application 
            SET auditor_id = %s, audit_status = %s, audit_remarks = %s, audit_time = %s
            WHERE recovery_app_id = %s
            """
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            success, msg = db.execute(sql, (auditor_id, audit_status, audit_remarks, now, app_id))
            if success:
                db.commit()
                return True
            db.rollback()
            return False
        finally:
            db.close()


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
