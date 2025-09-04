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
                cursorclass=DictCursor,
                use_unicode=True,
                init_command="SET NAMES utf8mb4"
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
    
    def update(self, table_name, update_data, condition_data):
        try:
            if not self.connection:
                if not self.connect():
                    return False, "数据库连接失败"

            # 构建 SQL 语句（避免 SQL 注入，使用参数化查询）
            update_fields = [f"{k} = %s" for k in update_data.keys()]
            condition_fields = [f"{k} = %s" for k in condition_data.keys()]
            sql = f"UPDATE {table_name} SET {', '.join(update_fields)} WHERE {', '.join(condition_fields)}"

            # 拼接参数（更新值 + 条件值）
            params = list(update_data.values()) + list(condition_data.values())

            # 执行 SQL
            self.cursor.execute(sql, params)
            self.commit()  # 提交事务

            # 检查影响行数（0 表示未找到符合条件的记录）
            if self.cursor.rowcount == 0:
                return False, "未找到要修改的记录"
            return True, "修改成功"

        except Exception as e:
            self.rollback()  # 出错回滚事务
            return False, f"修改失败：{str(e)}"
    
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
