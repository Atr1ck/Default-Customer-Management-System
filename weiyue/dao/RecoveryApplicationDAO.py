from db.base import Database
from db.models import (
    DefaultReason, RecoveryReason, CustomerInfo,
    DefaultApplication, RecoveryApplication, UserInfo,
    dict_to_model
)
from datetime import datetime

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
                return True, None
            db.rollback()
            return False, msg
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
