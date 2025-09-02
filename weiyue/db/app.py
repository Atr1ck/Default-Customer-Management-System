# app.py
from flask import Flask, jsonify, request
from default_reason_service import DefaultReasonService

app = Flask(__name__)
service = DefaultReasonService()

@app.route('/api/default-reasons', methods=['GET'])
def get_default_reasons():
    """获取所有违约原因"""
    reasons = service.get_reasons_for_display()
    return jsonify({'code': 200, 'data': reasons, 'message': '成功'})

@app.route('/api/default-reasons/<reason_id>', methods=['PUT'])
def update_reason(reason_id):
    """更新违约原因"""
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({'code': 400, 'message': '参数错误'})
    
    success = service.dao.update_reason_content(reason_id, data['content'])
    return jsonify({'code': 200 if success else 500, 'message': '更新成功' if success else '更新失败'})

@app.route('/api/default-reasons/<reason_id>/disable', methods=['POST'])
def disable_reason(reason_id):
    """禁用违约原因"""
    success = service.disable_reason(reason_id)
    return jsonify({'code': 200 if success else 500, 'message': '禁用成功' if success else '禁用失败'})

@app.route('/api/default-reasons', methods=['POST'])
def add_reason():
    """添加违约原因"""
    data = request.get_json()
    if not data or 'id' not in data or 'content' not in data:
        return jsonify({'code': 400, 'message': '参数错误'})
    
    success = service.add_new_reason(data['id'], data['content'])
    return jsonify({'code': 200 if success else 500, 'message': '添加成功' if success else '添加失败'})

if __name__ == '__main__':
    app.run(debug=True)
