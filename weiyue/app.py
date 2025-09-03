# weiyue/app.py
import sys
import os
import json  # 新增导入json模块
from flask import Flask, request, jsonify, Response  # 新增导入Response

# 添加项目根目录到 Python 路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

# 现在可以正常导入
from .services.reason_service import ReasonService
from .services.application_service import ApplicationService
from .services.user_service import UserService
from .config import SERVER_CONFIG

# 初始化Flask应用
app = Flask(__name__)

# 初始化服务
reason_service = ReasonService()
application_service = ApplicationService()
user_service = UserService()

# 辅助函数：返回中文JSON
def json_response_chinese(data, status=200):
    """返回包含中文的JSON响应"""
    return Response(
        json.dumps(data, ensure_ascii=False),
        status=status,
        mimetype='application/json; charset=utf-8'
    )

# 全局异常处理
@app.errorhandler(Exception)
def handle_exception(e):
    """全局异常处理"""
    return json_response_chinese({
        'success': False,
        'message': str(e)
    }, 500)


# 用户相关接口
@app.route('/api/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = user_service.login(username, password)
    if user:
        return json_response_chinese({
            'success': True,
            'data': {
                'user_id': user.user_id,
                'real_name': user.real_name,
                'department': user.department,
                'role': user.role
            }
        })
    return json_response_chinese({'success': False, 'message': '用户名或密码错误'}, 401)


# 违约原因相关接口
@app.route('/api/default-reasons', methods=['GET'])
def get_default_reasons():
    """获取所有启用的违约原因"""
    reasons = reason_service.get_all_enabled_default_reasons()
    return json_response_chinese({
        'success': True,
        'data': [reason.to_dict() for reason in reasons]
    })


@app.route('/api/default-reasons/<reason_id>', methods=['GET'])
def get_default_reason(reason_id):
    """获取指定违约原因"""
    reason = reason_service.get_default_reason_by_id(reason_id)
    if reason:
        return json_response_chinese({
            'success': True,
            'data': reason.to_dict()
        })
    return json_response_chinese({'success': False, 'message': '违约原因不存在'}, 404)


# 重生原因相关接口
@app.route('/api/recovery-reasons', methods=['GET'])
def get_recovery_reasons():
    """获取所有启用的重生原因"""
    reasons = reason_service.get_all_enabled_recovery_reasons()
    return json_response_chinese({
        'success': True,
        'data': [reason.to_dict() for reason in reasons]
    })


@app.route('/api/recovery-reasons/<reason_id>', methods=['GET'])
def get_recovery_reason(reason_id):
    """获取指定重生原因"""
    reason = reason_service.get_recovery_reason_by_id(reason_id)
    if reason:
        return json_response_chinese({
            'success': True,
            'data': reason.to_dict()
        })
    return json_response_chinese({'success': False, 'message': '重生原因不存在'}, 404)


# 违约申请相关接口
@app.route('/api/default-applications', methods=['POST'])
def create_default_application():
    """创建违约认定申请"""
    data = request.json
    result = application_service.create_default_application(
        customer_id=data.get('customer_id'),
        default_reason_id=data.get('default_reason_id'),
        severity_level=data.get('severity_level'),
        applicant_id=data.get('applicant_id'),
        remarks=data.get('remarks'),
        attachment_url=data.get('attachment_url')
    )

    if result:
        return json_response_chinese({'success': True, 'message': '违约申请创建成功'})
    return json_response_chinese({'success': False, 'message': '违约申请创建失败'}, 500)


@app.route('/api/default-applications/<app_id>/audit', methods=['POST'])
def audit_default_application(app_id):
    """审核违约认定申请"""
    data = request.json
    success, message = application_service.audit_default_application(
        app_id=app_id,
        auditor_id=data.get('auditor_id'),
        audit_status=data.get('audit_status'),
        audit_remarks=data.get('audit_remarks')
    )

    if success:
        return json_response_chinese({'success': True, 'message': '审核成功'})
    return json_response_chinese({'success': False, 'message': message or '审核失败'}, 500)


# 重生申请相关接口
@app.route('/api/recovery-applications', methods=['POST'])
def create_recovery_application():
    """创建重生申请"""
    data = request.json
    result = application_service.create_recovery_application(
        customer_id=data.get('customer_id'),
        original_default_app_id=data.get('original_default_app_id'),
        recovery_reason_id=data.get('recovery_reason_id'),
        applicant_id=data.get('applicant_id')
    )

    if result:
        return json_response_chinese({'success': True, 'message': '重生申请创建成功'})
    return json_response_chinese({'success': False, 'message': '重生申请创建失败'}, 500)


@app.route('/api/recovery-applications/<app_id>/audit', methods=['POST'])
def audit_recovery_application(app_id):
    """审核重生申请"""
    data = request.json
    success, message = application_service.audit_recovery_application(
        recovery_app_id=app_id,
        auditor_id=data.get('auditor_id'),
        audit_status=data.get('audit_status'),
        audit_remarks=data.get('audit_remarks')
    )

    if success:
        return json_response_chinese({'success': True, 'message': '审核成功'})
    return json_response_chinese({'success': False, 'message': message or '审核失败'}, 500)


# 启动应用
if __name__ == '__main__':
    app.run(
        host=SERVER_CONFIG['host'],
        port=SERVER_CONFIG['port'],
        debug=SERVER_CONFIG['debug']
    )
