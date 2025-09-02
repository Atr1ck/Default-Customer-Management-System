import logging
from config import LOG_CONFIG

# 配置日志
logging.basicConfig(
    level=getattr(logging, LOG_CONFIG['level']),
    format=LOG_CONFIG['format'],
    filename=LOG_CONFIG['file']
)
logger = logging.getLogger(__name__)

class BaseService:
    """服务基类，提供通用功能"""
    
    def __init__(self):
        self.logger = logger
        
    def generate_id(self, prefix, sequence):
        """生成带前缀的ID"""
        return f"{prefix}{str(sequence).zfill(4)}"
        
    def get_next_sequence(self, table_name, id_column, prefix):
        """获取下一个序号"""
        # 实际应用中应该查询数据库获取最大ID，然后加1
        # 这里简化实现
        from db.base import Database
        db = Database()
        try:
            sql = f"SELECT MAX({id_column}) as max_id FROM {table_name} WHERE {id_column} LIKE %s"
            success, msg = db.execute(sql, (f"{prefix}%",))
            if success:
                result = db.fetchone()
                if result and result['max_id']:
                    num = int(result['max_id'][len(prefix):])
                    return num + 1
            return 1
        finally:
            db.close()
