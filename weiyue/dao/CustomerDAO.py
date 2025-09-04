from db.base import Database
from db.models import (
    DefaultReason, RecoveryReason, CustomerInfo,
    DefaultApplication, RecoveryApplication, UserInfo,
    dict_to_model
)
from datetime import datetime

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
