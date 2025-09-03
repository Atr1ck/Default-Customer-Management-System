from datetime import datetime

class DefaultReason:
    """违约原因表(t_default_reason)实体类"""
    def __init__(self, reason_id, reason_content, is_enabled, create_time, update_time=None):
        self.reason_id = reason_id  # 违约原因唯一标识
        self.reason_content = reason_content  # 违约原因具体描述
        self.is_enabled = is_enabled  # 是否启用（1=启用，0=禁用）
        self.create_time = create_time  # 记录创建时间
        self.update_time = update_time  # 记录更新时间

    def to_dict(self):
        return {
            'reason_id': self.reason_id,
            'reason_content': self.reason_content,
            'is_enabled': self.is_enabled,
            'create_time': self.create_time,
            'update_time': self.update_time
        }

    def __repr__(self):
        return f"<DefaultReason {self.reason_id}: {self.reason_content}>"


class RecoveryReason:
    """重生原因表(t_recovery_reason)实体类"""
    def __init__(self, recovery_id, recovery_content, is_enabled, create_time, update_time=None):
        self.recovery_id = recovery_id  # 重生原因唯一标识
        self.recovery_content = recovery_content  # 重生原因具体描述
        self.is_enabled = is_enabled  # 是否启用（1=启用，0=禁用）
        self.create_time = create_time  # 记录创建时间
        self.update_time = update_time  # 记录更新时间

    def to_dict(self):
        return {
            'recovery_id': self.recovery_id,
            'recovery_content': self.recovery_content,
            'is_enabled': self.is_enabled,
            'create_time': self.create_time,
            'update_time': self.update_time
        }

    def __repr__(self):
        return f"<RecoveryReason {self.recovery_id}: {self.recovery_content}>"


class CustomerInfo:
    """客户信息表(t_customer_info)实体类"""
    def __init__(self, customer_id, customer_name, is_default, create_time, 
                 current_external_rating=None, industry_type=None, 
                 region=None, update_time=None):
        self.customer_id = customer_id  # 客户唯一标识
        self.customer_name = customer_name  # 客户名称
        self.current_external_rating = current_external_rating  # 最新外部等级
        self.industry_type = industry_type  # 所属行业
        self.region = region  # 所属区域
        self.is_default = is_default  # 当前是否为违约客户（1=是，0=否）
        self.create_time = create_time  # 客户记录创建时间
        self.update_time = update_time  # 客户记录更新时间

    def to_dict(self):
        return {
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'current_external_rating': self.current_external_rating,
            'industry_type': self.industry_type,
            'region': self.region,
            'is_default': self.is_default,
            'create_time': self.create_time,
            'update_time': self.update_time
        }

    def __repr__(self):
        return f"<CustomerInfo {self.customer_id}: {self.customer_name}>"


class DefaultApplication:
    """违约认定申请表(t_default_application)实体类"""
    def __init__(self, app_id, customer_id, default_reason_id, severity_level,
                 applicant_id, apply_time, audit_status, remarks=None,
                 attachment_url=None, auditor_id=None, audit_time=None,
                 audit_remarks=None):
        self.app_id = app_id  # 申请单唯一标识
        self.customer_id = customer_id  # 关联客户表的customer_id
        self.default_reason_id = default_reason_id  # 关联违约原因表的reason_id
        self.severity_level = severity_level  # 违约严重性（高/中/低）
        self.remarks = remarks  # 备注信息
        self.attachment_url = attachment_url  # 附件存储路径
        self.applicant_id = applicant_id  # 申请人ID（关联用户表）
        self.apply_time = apply_time  # 申请时间
        self.audit_status = audit_status  # 审核状态（待审核/同意/拒绝）
        self.auditor_id = auditor_id  # 审核人ID（关联用户表）
        self.audit_time = audit_time  # 审核时间
        self.audit_remarks = audit_remarks  # 审核备注

    def to_dict(self):
        return {
            'app_id': self.app_id,
            'customer_id': self.customer_id,
            'default_reason_id': self.default_reason_id,
            'severity_level': self.severity_level,
            'remarks': self.remarks,
            'attachment_url': self.attachment_url,
            'applicant_id': self.applicant_id,
            'apply_time': self.apply_time,
            'audit_status': self.audit_status,
            'auditor_id': self.auditor_id,
            'audit_time': self.audit_time,
            'audit_remarks': self.audit_remarks
        }

    def __repr__(self):
        return f"<DefaultApplication {self.app_id}: Customer {self.customer_id}>"


class RecoveryApplication:
    """违约重生申请表(t_recovery_application)实体类"""
    def __init__(self, recovery_app_id, customer_id, original_default_app_id,
                 recovery_reason_id, applicant_id, apply_time, audit_status,
                 auditor_id=None, audit_time=None, audit_remarks=None):
        self.recovery_app_id = recovery_app_id  # 重生申请单唯一标识
        self.customer_id = customer_id  # 关联客户表的customer_id
        self.original_default_app_id = original_default_app_id  # 关联原违约认定申请表的app_id
        self.recovery_reason_id = recovery_reason_id  # 关联重生原因表的recovery_id
        self.applicant_id = applicant_id  # 申请人ID（关联用户表）
        self.apply_time = apply_time  # 重生申请时间
        self.audit_status = audit_status  # 审核状态（待审核/同意/拒绝）
        self.auditor_id = auditor_id  # 审核人ID（关联用户表）
        self.audit_time = audit_time  # 审核时间
        self.audit_remarks = audit_remarks  # 审核备注

    def to_dict(self):
        return {
            'recovery_app_id': self.recovery_app_id,
            'customer_id': self.customer_id,
            'original_default_app_id': self.original_default_app_id,
            'recovery_reason_id': self.recovery_reason_id,
            'applicant_id': self.applicant_id,
            'apply_time': self.apply_time,
            'audit_status': self.audit_status,
            'auditor_id': self.auditor_id,
            'audit_time': self.audit_time,
            'audit_remarks': self.audit_remarks
        }

    def __repr__(self):
        return f"<RecoveryApplication {self.recovery_app_id}: Customer {self.customer_id}>"


class UserInfo:
    """用户信息表(t_user_info)实体类"""
    def __init__(self, user_id, user_name, real_name, department, role,
                 password, create_time, phone=None, email=None, update_time=None):
        self.user_id = user_id  # 用户唯一标识
        self.user_name = user_name  # 用户名（登录账号）
        self.real_name = real_name  # 真实姓名
        self.department = department  # 所属部门
        self.role = role  # 角色（申请人/审核人/管理员）
        self.password = password  # 加密后的登录密码
        self.phone = phone  # 联系电话
        self.email = email  # 邮箱
        self.create_time = create_time  # 用户创建时间
        self.update_time = update_time  # 用户信息更新时间

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'user_name': self.user_name,
            'real_name': self.real_name,
            'department': self.department,
            'role': self.role,
            'phone': self.phone,
            'email': self.email,
            'create_time': self.create_time,
            'update_time': self.update_time
        }

    def __repr__(self):
        return f"<UserInfo {self.user_id}: {self.real_name}>"


# 辅助函数：将数据库查询结果转换为实体类对象
def dict_to_model(data, model_class):
    """
    将字典转换为模型对象
    :param data: 字典类型数据（通常是数据库查询结果）
    :param model_class: 模型类
    :return: 模型对象实例
    """
    if not data:
        return None
        
    # 处理datetime类型字段
    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.strftime('%Y-%m-%d %H:%M:%S')
            
    # 过滤掉模型类不接受的参数
    params = {k: v for k, v in data.items() if k in model_class.__init__.__code__.co_varnames}
    return model_class(**params)
