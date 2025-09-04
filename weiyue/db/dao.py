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

    @staticmethod
    def list_all():
        """获取所有客户信息"""
        db = Database()
        try:
            sql = "SELECT * FROM t_customer_info ORDER BY create_time DESC"
            success, msg = db.execute(sql)
            if success:
                results = db.fetchall()
                return [dict_to_model(row, CustomerInfo) for row in results]
            return []
        finally:
            db.close()

    @staticmethod
    def list_defaulted():
        """获取已违约客户"""
        db = Database()
        try:
            sql = "SELECT * FROM t_customer_info WHERE is_default = 1 ORDER BY update_time DESC, create_time DESC"
            success, msg = db.execute(sql)
            if success:
                results = db.fetchall()
                return [dict_to_model(row, CustomerInfo) for row in results]
            return []
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
    def get_latest_by_customer(customer_id):
        """获取某客户最新的违约申请（按申请时间倒序）"""
        db = Database()
        try:
            sql = """
            SELECT * FROM t_default_application 
            WHERE customer_id = %s 
            ORDER BY apply_time DESC LIMIT 1
            """
            success, msg = db.execute(sql, (customer_id,))
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

    @staticmethod
    def list_all():
        """查询全部违约申请，按申请时间倒序"""
        db = Database()
        try:
            sql = "SELECT * FROM t_default_application ORDER BY apply_time DESC"
            success, msg = db.execute(sql)
            if success:
                rows = db.fetchall()
                return [dict_to_model(row, DefaultApplication) for row in rows]
            return []
        finally:
            db.close()

    @staticmethod
    def list_by_status(status):
        """按审核状态筛选违约申请（待审核/同意/拒绝）"""
        db = Database()
        try:
            sql = "SELECT * FROM t_default_application WHERE audit_status = %s ORDER BY apply_time DESC"
            success, msg = db.execute(sql, (status,))
            if success:
                rows = db.fetchall()
                return [dict_to_model(row, DefaultApplication) for row in rows]
            return []
        finally:
            db.close()

    @staticmethod
    def list_with_filters(customer_name=None, status=None, start_date=None, end_date=None, reviewer=None):
        """多条件筛选违约申请"""
        db = Database()
        try:
            # 构建基础查询
            sql = """
            SELECT da.* FROM t_default_application da
            LEFT JOIN t_customer_info ci ON da.customer_id = ci.customer_id
            LEFT JOIN t_user_info ui ON da.auditor_id = ui.user_id
            WHERE 1=1
            """
            params = []
            
            # 客户名称筛选
            if customer_name:
                sql += " AND ci.customer_name LIKE %s"
                params.append(f"%{customer_name}%")
            
            # 审核状态筛选
            if status:
                sql += " AND da.audit_status = %s"
                params.append(status)
            
            # 申请时间范围筛选
            if start_date:
                sql += " AND da.apply_time >= %s"
                params.append(f"{start_date} 00:00:00")
            if end_date:
                sql += " AND da.apply_time <= %s"
                params.append(f"{end_date} 23:59:59")
            
            # 审核人筛选
            if reviewer:
                sql += " AND ui.real_name LIKE %s"
                params.append(f"%{reviewer}%")
            
            sql += " ORDER BY da.apply_time DESC"
            
            success, msg = db.execute(sql, params)
            if success:
                rows = db.fetchall()
                return [dict_to_model(row, DefaultApplication) for row in rows]
            return []
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

    @staticmethod
    def list_all():
        """查询全部重生申请，按申请时间倒序"""
        db = Database()
        try:
            sql = "SELECT * FROM t_recovery_application ORDER BY apply_time DESC"
            success, msg = db.execute(sql)
            if success:
                rows = db.fetchall()
                return [dict_to_model(row, RecoveryApplication) for row in rows]
            return []
        finally:
            db.close()

    @staticmethod
    def list_by_status(status):
        """按审核状态筛选重生申请（待审核/同意/拒绝）"""
        db = Database()
        try:
            sql = "SELECT * FROM t_recovery_application WHERE audit_status = %s ORDER BY apply_time DESC"
            success, msg = db.execute(sql, (status,))
            if success:
                rows = db.fetchall()
                return [dict_to_model(row, RecoveryApplication) for row in rows]
            return []
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
