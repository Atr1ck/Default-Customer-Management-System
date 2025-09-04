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
        from db.base import Database
        db = Database()
        try:
            # 以数字方式获取前缀后的最大序号，避免字符串比较导致顺序错误
            prefix_len = len(prefix)
            sql = (
                f"SELECT COALESCE(MAX(CAST(SUBSTRING({id_column}, %s) AS UNSIGNED)), 0) AS max_seq "
                f"FROM {table_name} WHERE {id_column} LIKE %s"
            )
            success, msg = db.execute(sql, (prefix_len + 1, f"{prefix}%"))
            if success:
                row = db.fetchone()
                max_seq = row['max_seq'] if row and 'max_seq' in row else 0
                return int(max_seq) + 1
            return 1
        finally:
            db.close()
