from db.dao import DefaultReasonDAO, RecoveryReasonDAO
from services.base_service import BaseService

class ReasonService(BaseService):
    """违约和重生原因管理服务"""
    
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
