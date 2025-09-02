import pymysql
from pymysql.cursors import DictCursor
from config import DB_CONFIG

class Database:
    """数据库连接基础类，提供连接管理和事务处理"""
    
    def __init__(self):
        self.connection = None
        self.cursor = None
        
    def connect(self):
        """建立数据库连接"""
        try:
            self.connection = pymysql.connect(
                host=DB_CONFIG['host'],
                user=DB_CONFIG['user'],
                password=DB_CONFIG['password'],
                database=DB_CONFIG['database'],
                port=DB_CONFIG['port'],
                charset=DB_CONFIG['charset'],
                cursorclass=DictCursor
            )
            self.cursor = self.connection.cursor()
            return True
        except Exception as e:
            print(f"数据库连接失败: {str(e)}")
            return False
            
    def close(self):
        """关闭数据库连接"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        self.cursor = None
        self.connection = None
        
    def commit(self):
        """提交事务"""
        if self.connection:
            self.connection.commit()
            
    def rollback(self):
        """回滚事务"""
        if self.connection:
            self.connection.rollback()
            
    def execute(self, sql, params=None):
        """执行SQL语句"""
        try:
            if not self.connection:
                if not self.connect():
                    return False, "数据库连接失败"
                    
            if params:
                self.cursor.execute(sql, params)
            else:
                self.cursor.execute(sql)
            return True, None
        except Exception as e:
            return False, f"SQL执行错误: {str(e)}"
            
    def fetchall(self):
        """获取所有查询结果"""
        return self.cursor.fetchall() if self.cursor else []
        
    def fetchone(self):
        """获取单条查询结果"""
        return self.cursor.fetchone() if self.cursor else None
        
    def get_lastrowid(self):
        """获取最后插入的ID"""
        return self.cursor.lastrowid if self.cursor else None
