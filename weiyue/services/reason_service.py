from dao.DefaultReasonDAO import DefaultReasonDAO
from dao.RecoveryReasonDAO import RecoveryReasonDAO
from .base_service import BaseService
from db.base import Database
from db.models import DefaultReason, RecoveryReason

class ReasonService(BaseService):
    """违约和重生原因管理服务"""
    
    def __init__(self):
        self.db = Database()  # 初始化数据库连
    
    def update_default_reason(self, reason_id, update_data):
        """
        修改违约原因
        :param reason_id: 要修改的违约原因ID（主键，不可改）
        :param update_data: 要更新的字段字典（如 {'reason_content': '新描述', 'is_enabled': 0}）
        :return: (success: bool, message: str)
        """
        # 1. 参数校验：确保必填字段存在
        if not update_data:
            return False, "未提供要修改的字段"
        if "reason_content" in update_data and not update_data["reason_content"].strip():
            return False, "原因描述不能为空"
        if "is_enabled" in update_data and update_data["is_enabled"] not in (0, 1):
            return False, "启用状态只能是 0（禁用）或 1（启用）"

        # 2. 调用数据库更新方法（表名：t_default_reason，条件：reason_id）
        return self.db.update(
            table_name="t_default_reason",
            update_data=update_data,
            condition_data={"reason_id": reason_id}
        )

    # -------------------------- 重生原因修改 --------------------------
    def update_recovery_reason(self, reason_id, update_data):
        """修改重生原因（逻辑与违约原因一致，仅表名不同）"""
        # 1. 参数校验
        if not update_data:
            return False, "未提供要修改的字段"
        if "reason_content" in update_data and not update_data["reason_content"].strip():
            return False, "原因描述不能为空"
        if "is_enabled" in update_data and update_data["is_enabled"] not in (0, 1):
            return False, "启用状态只能是 0（禁用）或 1（启用）"

        # 2. 调用数据库更新方法（表名：t_recovery_reason）
        return self.db.update(
            table_name="t_recovery_reason",
            update_data=update_data,
            condition_data={"reason_id": reason_id}
        )

    
    def get_all_enabled_default_reasons(self):
        """获取所有启用的违约原因"""
        try:
            return DefaultReasonDAO.get_all_enabled()
        except Exception as e:
            self.logger.error(f"获取违约原因失败: {str(e)}")
            return []
    
    def get_default_reason_by_id(self, reason_id):
        """根据ID获取违约原因"""
        try:
            return DefaultReasonDAO.get_by_id(reason_id)
        except Exception as e:
            self.logger.error(f"获取违约原因 {reason_id} 失败: {str(e)}")
            return None
    
    def get_all_enabled_recovery_reasons(self):
        """获取所有启用的重生原因"""
        try:
            return RecoveryReasonDAO.get_all_enabled()
        except Exception as e:
            self.logger.error(f"获取重生原因失败: {str(e)}")
            return []
    
    def get_recovery_reason_by_id(self, reason_id):
        """根据ID获取重生原因"""
        try:
            return RecoveryReasonDAO.get_by_id(reason_id)
        except Exception as e:
            self.logger.error(f"获取重生原因 {reason_id} 失败: {str(e)}")
            return None
