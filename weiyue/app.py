from flask import Flask, request, jsonify
from flask.json.provider import DefaultJSONProvider
import json
from services.reason_service import ReasonService
from services.application_service import ApplicationService
from services.user_service import UserService
from db.dao import CustomerDAO, RecoveryApplicationDAO, DefaultApplicationDAO, DefaultReasonDAO, UserDAO
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


# 客户列表接口
@app.route('/api/customers', methods=['GET'])
def list_customers():
    customers = CustomerDAO.list_all()
    return jsonify({
        'success': True,
        'data': [c.to_dict() for c in customers]
    })


@app.route('/api/customers/defaulted', methods=['GET'])
def list_defaulted_customers():
    customers = CustomerDAO.list_defaulted()
    return jsonify({
        'success': True,
        'data': [c.to_dict() for c in customers]
    })


# 违约审核列表（真实数据，支持多条件筛选）
@app.route('/api/defaultReviews', methods=['GET'])
def default_reviews():
    """查询违约申请审核列表，支持多条件筛选"""
    # 获取筛选参数
    customer_name = request.args.get('customerName')
    status = request.args.get('status')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    reviewer = request.args.get('reviewer')
    
    # 状态映射
    status_map = {
        'pending': '待审核',
        'approved': '同意',
        'rejected': '拒绝'
    }
    
    # 转换状态参数
    if status and status in status_map:
        status = status_map[status]
    
    # 使用多条件查询
    apps = DefaultApplicationDAO.list_with_filters(
        customer_name=customer_name,
        status=status,
        start_date=start_date,
        end_date=end_date,
        reviewer=reviewer
    )
    
    # 映射后端字段到前端所需
    data = []
    for app in apps:
        # 获取客户名称
        customer = CustomerDAO.get_by_id(app.customer_id)
        customer_name = customer.customer_name if customer else app.customer_id
        
        # 获取违约原因内容
        reason = DefaultReasonDAO.get_by_id(app.default_reason_id)
        reason_content = reason.reason_content if reason else app.default_reason_id
        
        # 获取审核人名称
        reviewer_name = ''
        if app.auditor_id:
            auditor = UserDAO.get_by_id(app.auditor_id)
            reviewer_name = auditor.real_name if auditor else app.auditor_id
        
        data.append({
            'id': app.app_id,
            'applicationId': app.app_id,
            'customerName': customer_name,
            'reasons': [reason_content],
            'severity': app.severity_level,
            'applyTime': app.apply_time,
            'status': 'pending' if app.audit_status == '待审核' else ('approved' if app.audit_status == '同意' else 'rejected'),
            'reviewer': reviewer_name,
            'reviewTime': app.audit_time or '',
            'reviewRemark': app.audit_remarks or ''
        })
    
    return jsonify({'success': True, 'data': data})


# 选项接口（严重性、状态）
@app.route('/api/severityOptions', methods=['GET'])
def severity_options():
    options = [
        { 'label': '高', 'value': 'high' },
        { 'label': '中', 'value': 'medium' },
        { 'label': '低', 'value': 'low' }
    ]
    return jsonify({'success': True, 'data': options})


@app.route('/api/statusOptions', methods=['GET'])
def status_options():
    options = [
        { 'label': '全部', 'value': '' },
        { 'label': '待审核', 'value': 'pending' },
        { 'label': '已通过', 'value': 'approved' },
        { 'label': '已拒绝', 'value': 'rejected' }
    ]
    return jsonify({'success': True, 'data': options})


# 统计接口（示例聚合数据）
@app.route('/api/statistics', methods=['GET'])
def statistics():
    data = {
        'industry': [
            { 'name': '制造业', 'count': 12, 'percentage': 40.0 },
            { 'name': '互联网', 'count': 9, 'percentage': 30.0 },
            { 'name': '金融', 'count': 9, 'percentage': 30.0 },
        ],
        'region': [
            { 'name': '华东', 'count': 10, 'percentage': 33.3 },
            { 'name': '华南', 'count': 8, 'percentage': 26.7 },
            { 'name': '华北', 'count': 12, 'percentage': 40.0 },
        ],
        'trend': [
            { 'date': '2025-01-01', 'count': 2 },
            { 'date': '2025-01-02', 'count': 4 },
            { 'date': '2025-01-03', 'count': 6 }
        ]
    }
    return jsonify({'success': True, 'data': data})


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


@app.route('/api/recovery-applications', methods=['GET'])
def list_recovery_applications():
    """查询重生申请，可选按 status 过滤（pending/approved/rejected）"""
    status_map = {
        'pending': '待审核',
        'approved': '同意',
        'rejected': '拒绝'
    }
    status = request.args.get('status')
    if status and status in status_map:
        apps = RecoveryApplicationDAO.list_by_status(status_map[status])
    else:
        apps = RecoveryApplicationDAO.list_all()
    # 映射后端字段到前端所需
    data = [
        {
            'id': a.recovery_app_id,
            'customerName': a.customer_id,
            'originalReason': '',
            'rebirthReason': a.recovery_reason_id,
            'status': 'pending' if a.audit_status == '待审核' else ('approved' if a.audit_status == '同意' else 'rejected'),
            'createTime': a.apply_time
        }
        for a in apps
    ]
    return jsonify({'success': True, 'data': data})


# 启动应用
if __name__ == '__main__':
    app.run(
        host=SERVER_CONFIG['host'],
        port=SERVER_CONFIG['port'],
        debug=SERVER_CONFIG['debug']
    )
