from db.base import Database
from db.models import (
    DefaultReason, RecoveryReason, CustomerInfo,
    DefaultApplication, RecoveryApplication, UserInfo,
    dict_to_model
)
from datetime import datetime

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
