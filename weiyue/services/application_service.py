from dao.DefaultApplicationDAO import DefaultApplicationDAO
from dao.RecoveryApplicationDAO import RecoveryApplicationDAO
from dao.CustomerDAO import CustomerDAO
from dao.UserDAO import UserDAO
from dao.DefaultReasonDAO import DefaultReasonDAO
from dao.RecoveryReasonDAO import RecoveryReasonDAO
from db.models import DefaultApplication, RecoveryApplication
from services.base_service import BaseService
from datetime import datetime

class ApplicationService(BaseService):
    """申请管理服务，处理违约和重生申请的创建与审核"""
    
    def create_default_application(self, customer_id, default_reason_id, severity_level,
                                   applicant_id, remarks=None, attachment_url=None):
        """创建违约认定申请"""
        try:
            # 验证客户是否存在
            customer = CustomerDAO.get_by_id(customer_id)
            if not customer:
                self.logger.error(f"创建违约申请失败：客户 {customer_id} 不存在")
                return False
                
            # 验证违约原因是否存在
            reason = DefaultReasonDAO.get_by_id(default_reason_id)
            if not reason:
                self.logger.error(f"创建违约申请失败：违约原因 {default_reason_id} 不存在")
                return False
                
            # 验证申请人是否存在
            user = UserDAO.get_by_id(applicant_id)
            if not user:
                self.logger.error(f"创建违约申请失败：申请人 {applicant_id} 不存在")
                return False
                
            # 生成申请ID
            sequence = self.get_next_sequence(
                "t_default_application", "app_id", "DEF"
            )
            app_id = self.generate_id("DEF", sequence)
            
            # 创建申请对象
            application = DefaultApplication(
                app_id=app_id,
                customer_id=customer_id,
                default_reason_id=default_reason_id,
                severity_level=severity_level,
                applicant_id=applicant_id,
                apply_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                audit_status="待审核",
                remarks=remarks,
                attachment_url=attachment_url
            )
            
            # 保存到数据库
            return DefaultApplicationDAO.create(application)
            
        except Exception as e:
            self.logger.error(f"创建违约申请失败: {str(e)}")
            return False
    
    def audit_default_application(self, app_id, auditor_id, audit_status, audit_remarks=None):
        """审核违约认定申请"""
        try:
            # 验证申请是否存在
            application = DefaultApplicationDAO.get_by_id(app_id)
            if not application:
                return False, f"申请 {app_id} 不存在"
                
            # 验证审核人是否存在
            auditor = UserDAO.get_by_id(auditor_id)
            if not auditor:
                return False, f"审核人 {auditor_id} 不存在"
                
            # 验证审核状态是否合法
            if audit_status not in ["同意", "拒绝"]:
                return False, "审核状态必须是'同意'或'拒绝'"
                
            # 更新审核状态
            success = DefaultApplicationDAO.update_audit_status(
                app_id, auditor_id, audit_status, audit_remarks
            )
            
            if success and audit_status == "同意":
                # 如果审核通过，更新客户违约状态
                CustomerDAO.update_default_status(application.customer_id, 1)
                
            return success, None if success else "更新审核状态失败"
            
        except Exception as e:
            self.logger.error(f"审核违约申请失败: {str(e)}")
            return False, str(e)
    
    def create_recovery_application(self, customer_id, original_default_app_id,
                                   recovery_reason_id, applicant_id):
        """创建重生申请"""
        try:
            # 验证客户是否存在
            customer = CustomerDAO.get_by_id(customer_id)
            if not customer:
                self.logger.error(f"创建重生申请失败：客户 {customer_id} 不存在")
                return False
                
            # 验证原违约申请是否存在
            # 若未指定原违约申请ID，则按客户查找最新一条
            original_app = None
            if original_default_app_id:
                original_app = DefaultApplicationDAO.get_by_id(original_default_app_id)
            else:
                original_app = DefaultApplicationDAO.get_latest_by_customer(customer_id)
            if not original_app:
                self.logger.error(f"创建重生申请失败：未找到客户 {customer_id} 的原违约申请")
                return False
                
            # 验证重生原因是否存在
            reason = RecoveryReasonDAO.get_by_id(recovery_reason_id)
            if not reason:
                self.logger.error(f"创建重生申请失败：重生原因 {recovery_reason_id} 不存在")
                return False
                
            # 验证申请人是否存在
            user = UserDAO.get_by_id(applicant_id)
            if not user:
                self.logger.error(f"创建重生申请失败：申请人 {applicant_id} 不存在")
                return False
                
            # 生成申请ID
            sequence = self.get_next_sequence(
                "t_recovery_application", "recovery_app_id", "REC"
            )
            recovery_app_id = self.generate_id("REC", sequence)
            
            # 创建申请对象
            application = RecoveryApplication(
                recovery_app_id=recovery_app_id,
                customer_id=customer_id,
                original_default_app_id=original_default_app_id,
                recovery_reason_id=recovery_reason_id,
                applicant_id=applicant_id,
                apply_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                audit_status="待审核"
            )
            
            # 保存到数据库
            return RecoveryApplicationDAO.create(application)
            
        except Exception as e:
            self.logger.error(f"创建重生申请失败: {str(e)}")
            return False
    
    def audit_recovery_application(self, recovery_app_id, auditor_id, audit_status, audit_remarks=None):
        """审核重生申请"""
        try:
            # 验证申请是否存在
            application = RecoveryApplicationDAO.get_by_id(recovery_app_id)
            if not application:
                return False, f"重生申请 {recovery_app_id} 不存在"
                
            # 验证审核人是否存在
            auditor = UserDAO.get_by_id(auditor_id)
            if not auditor:
                return False, f"审核人 {auditor_id} 不存在"
                
            # 验证审核状态是否合法
            if audit_status not in ["同意", "拒绝"]:
                return False, "审核状态必须是'同意'或'拒绝'"
                
            # 更新审核状态
            success = RecoveryApplicationDAO.update_audit_status(
                recovery_app_id, auditor_id, audit_status, audit_remarks
            )
            
            if success and audit_status == "同意":
                # 如果审核通过，更新客户违约状态
                CustomerDAO.update_default_status(application.customer_id, 0)
                
            return success, None if success else "更新审核状态失败"
            
        except Exception as e:
            self.logger.error(f"审核重生申请失败: {str(e)}")
            return False, str(e)
