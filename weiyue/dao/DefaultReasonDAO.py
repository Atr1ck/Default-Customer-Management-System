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
            sql = "SELECT * FROM t_default_reason ORDER BY create_time DESC"
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
