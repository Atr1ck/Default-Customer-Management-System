from flask import Flask, request, jsonify
from flask.json.provider import DefaultJSONProvider
import json
import os
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
from werkzeug.utils import send_from_directory
from services.reason_service import ReasonService
from services.application_service import ApplicationService
from services.user_service import UserService
from db.dao import CustomerDAO, RecoveryApplicationDAO, DefaultApplicationDAO, DefaultReasonDAO, RecoveryReasonDAO, UserDAO
from config import SERVER_CONFIG
from flask_cors import CORS

# 文件上传配置
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'}

# 确保上传目录存在
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


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


# 文件上传接口
@app.route('/api/upload', methods=['POST'])
def upload_file():
    """文件上传接口"""
    try:
        # 检查是否有文件
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': '没有选择文件'}), 400
        
        file = request.files['file']
        
        # 检查文件名是否为空
        if file.filename == '':
            return jsonify({'success': False, 'message': '没有选择文件'}), 400
        
        # 检查文件类型
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            
            # 生成唯一文件名，避免重名
            import uuid
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            # 保存文件
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            # 返回文件URL
            file_url = f"/uploads/{unique_filename}"
            
            return jsonify({
                'success': True,
                'message': '文件上传成功',
                'data': {
                    'filename': filename,
                    'url': file_url,
                    'size': os.path.getsize(file_path)
                }
            })
        else:
            return jsonify({'success': False, 'message': '不支持的文件类型'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'文件上传失败: {str(e)}'}), 500


# 文件下载接口
@app.route('/uploads/<filename>')
def download_file(filename):
    """文件下载接口"""
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        return jsonify({'success': False, 'message': f'文件下载失败: {str(e)}'}), 404


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

@app.route('/api/default-reasons/<reason_id>/enable', methods=['PUT'])
def set_default_reason_enable(reason_id):
    """启用/禁用违约原因"""
    data = request.json or {}
    is_enabled = data.get('is_enabled')
    if is_enabled not in (0, 1, True, False):
        return jsonify({'success': False, 'message': '参数错误：is_enabled 只能是 0/1 或 true/false'}), 400
    # 归一化为 0/1
    is_enabled_val = 1 if bool(is_enabled) else 0
    success, message = reason_service.update_default_reason(reason_id, {'is_enabled': is_enabled_val})
    if success:
        return jsonify({'success': True, 'message': '更新成功'})
    return jsonify({'success': False, 'message': message or '更新失败'}), 500


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
            "data": {"reason_id": reason_id}
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

@app.route('/api/recovery-reasons/<reason_id>/enable', methods=['PUT'])
def set_recovery_reason_enable(reason_id):
    """启用/禁用重生原因"""
    data = request.json or {}
    is_enabled = data.get('is_enabled')
    if is_enabled not in (0, 1, True, False):
        return jsonify({'success': False, 'message': '参数错误：is_enabled 只能是 0/1 或 true/false'}), 400
    # 归一化为 0/1
    is_enabled_val = 1 if bool(is_enabled) else 0
    success, message = reason_service.update_recovery_reason(reason_id, {'is_enabled': is_enabled_val})
    if success:
        return jsonify({'success': True, 'message': '更新成功'})
    return jsonify({'success': False, 'message': message or '更新失败'}), 500


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


# 统计接口（基于数据库真实数据）
@app.route('/api/statistics', methods=['GET'])
def statistics():
    from db.base import Database
    db = Database()
    try:
        # 1) 行业分布：已违约客户（is_default=1）按 industry_type 聚合
        industry_sql = """
            SELECT COALESCE(industry_type, '未知') AS name, COUNT(*) AS cnt
            FROM t_customer_info
            WHERE is_default = 1
            GROUP BY COALESCE(industry_type, '未知')
            ORDER BY cnt DESC
        """
        success, msg = db.execute(industry_sql)
        industry_rows = db.fetchall() if success else []
        total_industry = sum(r['cnt'] for r in industry_rows) or 0
        industry = [
            {
                'name': r['name'],
                'count': int(r['cnt']),
                'percentage': round((r['cnt'] / total_industry) * 100, 1) if total_industry else 0.0
            }
            for r in industry_rows
        ]

        # 2) 区域分布：已违约客户按 region 聚合
        region_sql = """
            SELECT COALESCE(region, '未知') AS name, COUNT(*) AS cnt
            FROM t_customer_info
            WHERE is_default = 1
            GROUP BY COALESCE(region, '未知')
            ORDER BY cnt DESC
        """
        success, msg = db.execute(region_sql)
        region_rows = db.fetchall() if success else []
        total_region = sum(r['cnt'] for r in region_rows) or 0
        region = [
            {
                'name': r['name'],
                'count': int(r['cnt']),
                'percentage': round((r['cnt'] / total_region) * 100, 1) if total_region else 0.0
            }
            for r in region_rows
        ]

        # 3) 趋势：违约申请按日期统计近30天数量
        trend_sql = """
            SELECT DATE(apply_time) AS d, COUNT(*) AS cnt
            FROM t_default_application
            WHERE apply_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(apply_time)
            ORDER BY d ASC
        """
        success, msg = db.execute(trend_sql)
        trend_rows = db.fetchall() if success else []
        trend = [
            {
                'date': r['d'].strftime('%Y-%m-%d') if hasattr(r['d'], 'strftime') else str(r['d']),
                'count': int(r['cnt'])
            }
            for r in trend_rows
        ]

        return jsonify({'success': True, 'data': {
            'industry': industry,
            'region': region,
            'trend': trend
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': f'统计查询失败: {str(e)}'}), 500
    finally:
        db.close()


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


@app.route('/api/default-applications', methods=['GET'])
def list_default_applications():
    """获取违约申请列表，支持筛选"""
    # 获取筛选参数
    customer_id = request.args.get('customer_id')
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # 状态映射
    status_map = {
        'pending': '待审核',
        'approved': '同意',
        'rejected': '拒绝'
    }
    
    # 转换状态参数
    if status and status in status_map:
        status = status_map[status]
    
    # 获取申请列表
    applications = application_service.get_default_applications(
        customer_id=customer_id,
        status=status,
        start_date=start_date,
        end_date=end_date
    )
    
    # 映射数据格式
    data = []
    for app in applications:
        # 获取客户名称
        customer = CustomerDAO.get_by_id(app.customer_id)
        customer_name = customer.customer_name if customer else app.customer_id
        
        # 获取违约原因内容
        reason = DefaultReasonDAO.get_by_id(app.default_reason_id)
        reason_content = reason.reason_content if reason else app.default_reason_id
        
        # 获取申请人名称
        applicant = UserDAO.get_by_id(app.applicant_id)
        applicant_name = applicant.real_name if applicant else app.applicant_id
        
        # 获取审核人名称
        reviewer_name = ''
        if app.auditor_id:
            auditor = UserDAO.get_by_id(app.auditor_id)
            reviewer_name = auditor.real_name if auditor else app.auditor_id
        
        data.append({
            'id': app.app_id,
            'applicationId': app.app_id,
            'customerName': customer_name,
            'customerId': app.customer_id,
            'reasons': [reason_content],
            'reasonId': app.default_reason_id,
            'severity': app.severity_level,
            'remarks': app.remarks or '',
            'applicant': applicant_name,
            'applicantId': app.applicant_id,
            'applyTime': app.apply_time,
            'status': 'pending' if app.audit_status == '待审核' else ('approved' if app.audit_status == '同意' else 'rejected'),
            'auditStatus': app.audit_status,
            'reviewer': reviewer_name,
            'reviewerId': app.auditor_id,
            'reviewTime': app.audit_time or '',
            'reviewRemark': app.audit_remarks or '',
            'attachmentUrl': app.attachment_url or ''
        })
    
    return jsonify({'success': True, 'data': data})


@app.route('/api/default-applications/<app_id>', methods=['GET'])
def get_default_application(app_id):
    """获取违约申请详情"""
    application = application_service.get_default_application_by_id(app_id)
    if not application:
        return jsonify({'success': False, 'message': '申请不存在'}), 404
    
    # 获取关联信息
    customer = CustomerDAO.get_by_id(application.customer_id)
    reason = DefaultReasonDAO.get_by_id(application.default_reason_id)
    applicant = UserDAO.get_by_id(application.applicant_id)
    auditor = UserDAO.get_by_id(application.auditor_id) if application.auditor_id else None
    
    data = {
        'id': application.app_id,
        'customerId': application.customer_id,
        'customerName': customer.customer_name if customer else application.customer_id,
        'defaultReasonId': application.default_reason_id,
        'defaultReason': reason.reason_content if reason else application.default_reason_id,
        'severityLevel': application.severity_level,
        'remarks': application.remarks or '',
        'attachmentUrl': application.attachment_url or '',
        'applicantId': application.applicant_id,
        'applicantName': applicant.real_name if applicant else application.applicant_id,
        'applyTime': application.apply_time,
        'auditStatus': application.audit_status,
        'auditorId': application.auditor_id,
        'auditorName': auditor.real_name if auditor else (application.auditor_id or ''),
        'auditTime': application.audit_time or '',
        'auditRemarks': application.audit_remarks or ''
    }
    
    return jsonify({'success': True, 'data': data})


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
    try:
        data = request.json
        print(f"收到重生申请数据: {data}")  # 添加调试日志
        
        result = application_service.create_recovery_application(
            customer_id=data.get('customer_id'),
            original_default_app_id=data.get('original_default_app_id'),
            recovery_reason_id=data.get('recovery_reason_id'),
            applicant_id=data.get('applicant_id')
        )

        if result:
            return jsonify({'success': True, 'message': '重生申请创建成功'})
        else:
            return jsonify({'success': False, 'message': '重生申请创建失败，请检查数据'}), 500
            
    except Exception as e:
        print(f"创建重生申请时发生异常: {str(e)}")  # 添加异常日志
        return jsonify({'success': False, 'message': f'创建重生申请失败: {str(e)}'}), 500


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
    start_date = request.args.get('startDate')  # YYYY-MM-DD
    end_date = request.args.get('endDate')      # YYYY-MM-DD
    if status and status in status_map:
        apps = RecoveryApplicationDAO.list_by_status(status_map[status])
    else:
        apps = RecoveryApplicationDAO.list_all()
    
    # 映射后端字段到前端所需
    data = []
    for app in apps:
        # 申请时间范围筛选（基于重生申请 apply_time）
        if start_date and (not app.apply_time or str(app.apply_time) < f"{start_date} 00:00:00"):
            continue
        if end_date and (not app.apply_time or str(app.apply_time) > f"{end_date} 23:59:59"):
            continue
        # 获取客户信息
        customer = CustomerDAO.get_by_id(app.customer_id)
        customer_name = customer.customer_name if customer else app.customer_id
        external_level = customer.current_external_rating if customer else ''
        
        # 获取原违约原因
        original_reason = ''
        if app.original_default_app_id:
            original_app = DefaultApplicationDAO.get_by_id(app.original_default_app_id)
            if original_app:
                reason = DefaultReasonDAO.get_by_id(original_app.default_reason_id)
                original_reason = reason.reason_content if reason else original_app.default_reason_id
                severity = original_app.severity_level
            else:
                severity = 'medium'
        else:
            severity = 'medium'
        
        # 获取重生原因
        rebirth_reason = ''
        if app.recovery_reason_id:
            reason = RecoveryReasonDAO.get_by_id(app.recovery_reason_id)
            rebirth_reason = reason.recovery_content if reason else app.recovery_reason_id
        
        # 获取审核人信息
        reviewer_name = ''
        if app.auditor_id:
            auditor = UserDAO.get_by_id(app.auditor_id)
            reviewer_name = auditor.real_name if auditor else app.auditor_id
        
        data.append({
            'id': app.recovery_app_id,
            'customerName': customer_name,
            'originalReason': original_reason,
            'rebirthReason': rebirth_reason,
            'severity': severity,
            'status': 'pending' if app.audit_status == '待审核' else ('approved' if app.audit_status == '同意' else 'rejected'),
            'applyTime': app.apply_time,
            'reviewer': reviewer_name,
            'reviewTime': app.audit_time or '',
            'reviewRemark': app.audit_remarks or '',
            'externalLevel': external_level
        })
    
    return jsonify({'success': True, 'data': data})


# 启动应用
if __name__ == '__main__':
    app.run(
        host=SERVER_CONFIG['host'],
        port=SERVER_CONFIG['port'],
        debug=SERVER_CONFIG['debug']
    )
