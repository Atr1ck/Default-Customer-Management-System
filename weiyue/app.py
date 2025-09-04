from flask import Flask, request, jsonify
from flask.json.provider import DefaultJSONProvider
import json
from services.reason_service import ReasonService
from services.application_service import ApplicationService
from services.user_service import UserService
from config import SERVER_CONFIG
from flask_cors import CORS


# 自定义JSON提供器，解决中文显示问题
class CustomJSONProvider(DefaultJSONProvider):
    def dumps(self, obj, **kwargs):
        # 确保中文不被转为Unicode转义字符
        return json.dumps(obj, ensure_ascii=False, **kwargs)

    def loads(self, s, **kwargs):
        return json.loads(s, **kwargs)


# 初始化Flask应用
app = Flask(__name__)
# 启用 CORS，允许前端开发端口访问
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, supports_credentials=False)
# 应用自定义JSON提供器
app.json = CustomJSONProvider(app)


# 设置全局响应头，强制UTF-8编码
@app.after_request
def after_request(response):
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response


# 初始化服务
reason_service = ReasonService()
application_service = ApplicationService()
user_service = UserService()


# 全局异常处理
@app.errorhandler(Exception)
def handle_exception(e):
    """全局异常处理"""
    return jsonify({
        'success': False,
        'message': str(e)
    }), 500


@app.route('/test', methods=['GET'])
def test():
    # 测试中文显示
    return jsonify({'success': True, 'message': '测试接口正常，中文显示测试：成功'})


# 用户相关接口
@app.route('/api/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = user_service.login(username, password)
    if user:
        return jsonify({
            'success': True,
            'data': {
                'user_id': user.user_id,
                'real_name': user.real_name,
                'department': user.department,
                'role': user.role
            }
        })
    return jsonify({'success': False, 'message': '用户名或密码错误'}), 401


# 违约原因相关接口
@app.route('/api/default-reasons', methods=['GET'])
def get_default_reasons():
    """获取所有启用的违约原因"""
    reasons = reason_service.get_all_enabled_default_reasons()
    return jsonify({
        'success': True,
        'data': [reason.to_dict() for reason in reasons]
    })


@app.route('/api/default-reasons/<reason_id>', methods=['GET'])
def get_default_reason(reason_id):
    """获取指定违约原因"""
    reason = reason_service.get_default_reason_by_id(reason_id)
    if reason:
        return jsonify({
            'success': True,
            'data': reason.to_dict()
        })
    return jsonify({'success': False, 'message': '违约原因不存在'}), 404

@app.route('/api/default-reasons/<reason_id>', methods=['PUT'])
def update_default_reason(reason_id):
    """
    修改违约原因
    :param reason_id: 要修改的违约原因ID（从URL路径获取）
    :请求体（JSON）: {
        "reason_content": "新的违约原因描述",  // 可选（不修改则不传递）
        "is_enabled": 1  // 可选（0=禁用，1=启用，不修改则不传递）
    }
    """
    # 1. 获取请求体数据
    update_data = request.json
    if not update_data:
        return jsonify({
            "success": False,
            "message": "请求体不能为空，需传递要修改的字段"
        }), 400

    # 2. 调用服务层方法
    success, message = reason_service.update_default_reason(reason_id, update_data)

    # 3. 返回结果
    if success:
        return jsonify({
            "success": True,
            "message": message,
            "data": {"reason_id": reason_id}  // 返回修改的ID，方便前端确认
        })
    else:
        # 根据错误类型返回对应状态码
        if "未找到" in message:
            status_code = 404
        elif "参数错误" in message:
            status_code = 400
        else:
            status_code = 500
        return jsonify({
            "success": False,
            "message": message
        }), status_code

# -------------------------- 重生原因修改接口 --------------------------
@app.route('/api/recovery-reasons/<reason_id>', methods=['PUT'])
def update_recovery_reason(reason_id):
    """修改重生原因（与违约原因接口逻辑一致）"""
    update_data = request.json
    if not update_data:
        return jsonify({
            "success": False,
            "message": "请求体不能为空，需传递要修改的字段"
        }), 400

    success, message = reason_service.update_recovery_reason(reason_id, update_data)

    if success:
        return jsonify({
            "success": True,
            "message": message,
            "data": {"reason_id": reason_id}
        })
    else:
        status_code = 404 if "未找到" in message else 400 if "参数错误" in message else 500
        return jsonify({
            "success": False,
            "message": message
        }), status_code


# 重生原因相关接口
@app.route('/api/recovery-reasons', methods=['GET'])
def get_recovery_reasons():
    """获取所有启用的重生原因"""
    reasons = reason_service.get_all_enabled_recovery_reasons()
    return jsonify({
        'success': True,
        'data': [reason.to_dict() for reason in reasons]
    })


@app.route('/api/recovery-reasons/<reason_id>', methods=['GET'])
def get_recovery_reason(reason_id):
    """获取指定重生原因"""
    reason = reason_service.get_recovery_reason_by_id(reason_id)
    if reason:
        return jsonify({
            'success': True,
            'data': reason.to_dict()
        })
    return jsonify({'success': False, 'message': '重生原因不存在'}), 404


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
        return jsonify({'success': True, 'message': '违约申请创建成功'})
    return jsonify({'success': False, 'message': '违约申请创建失败'}), 500


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
        return jsonify({'success': True, 'message': '审核成功'})
    return jsonify({'success': False, 'message': message or '审核失败'}), 500


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
        return jsonify({'success': True, 'message': '重生申请创建成功'})
    return jsonify({'success': False, 'message': '重生申请创建失败'}), 500


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
        return jsonify({'success': True, 'message': '审核成功'})
    return jsonify({'success': False, 'message': message or '审核失败'}), 500


# 启动应用
if __name__ == '__main__':
    app.run(
        host=SERVER_CONFIG['host'],
        port=SERVER_CONFIG['port'],
        debug=SERVER_CONFIG['debug']
    )
