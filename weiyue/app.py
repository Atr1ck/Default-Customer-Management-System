from flask import Flask, request, jsonify
from flask.json import JSONEncoder
import json  # 导入标准json模块
from services.reason_service import ReasonService
from services.application_service import ApplicationService
from services.user_service import UserService
from config import SERVER_CONFIG

# 自定义JSON编码器，解决中文显示问题
class CustomJSONEncoder(JSONEncoder):
    def encode(self, obj):
        # 确保中文不被转为Unicode转义字符
        return json.dumps(obj, ensure_ascii=False, encoding='utf-8')  # 补充encoding参数

# 初始化Flask应用
app = Flask(__name__)

app.config['JSON_AS_ASCII'] = False  # 新增：禁用ASCII编码，中文不转义
# 应用自定义JSON编码器
app.json_encoder = CustomJSONEncoder


# 设置全局响应头，强制UTF-8编码
@app.after_request
def after_request(response):
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    # 新增：防止某些浏览器默认用GBK解析，补充编码声明
    response.headers['Content-Encoding'] = 'utf-8'
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
    return jsonify({'success': True, 'message': '测试接口正常，中文显示测试：成功！特殊符号测试：【】、（）','data': {'测试字段': '中文值'})
    
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
