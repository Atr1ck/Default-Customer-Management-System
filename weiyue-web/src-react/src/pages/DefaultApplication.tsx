import React, { useState, useEffect } from 'react';
import {
  Form,
  Select,
  Input,
  Radio,
  Upload,
  Button,
  Card,
  message,
  Space,
  Divider,
  Alert,
  Spin,
  Table,
  Tag,
  Tooltip,
  Row,
  Col
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined, SaveOutlined, SendOutlined, ExclamationCircleOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import type { DefaultApplication, Customer, DefaultReason } from '../types';
import { CustomerAPI, ReasonAPI, DefaultApplicationAPI } from '../services/api';
import { getCurrentUserId } from '../utils/auth';

const { TextArea } = Input;
const { Option } = Select;

const DefaultApplication: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reasons, setReasons] = useState<DefaultReason[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    loadInitialData();
    loadApplications();
  }, []);

  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      setError('');
      
      const [customersRes, reasonsRes] = await Promise.all([
        CustomerAPI.list(),
        ReasonAPI.list()
      ]);
      
      // 只显示未违约的客户
      const availableCustomers = (customersRes as Customer[]).filter(c => !c.isDefaulted);
      if (availableCustomers.length === 0) {
        setError('当前没有可申请违约的客户，所有客户都已经是违约状态');
      }
      
      setCustomers(availableCustomers);
      setReasons((reasonsRes as DefaultReason[]).filter(r => r.isEnabled));
      
    } catch (error: unknown) {
      console.error('加载数据失败:', error);
      setError('加载客户和违约原因数据失败，请刷新页面重试');
    } finally {
      setDataLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      setApplicationsLoading(true);
      const currentUserId = getCurrentUserId();
      
      // 由于设置了默认值，currentUserId 总是有值
      const apps = await DefaultApplicationAPI.list({ customer_id: undefined });
      // 过滤当前用户的申请
      const userApps = apps.filter((app: Record<string, unknown>) => app.applicantId === currentUserId);
      setApplications(userApps);
    } catch (error: unknown) {
      console.error('加载申请列表失败:', error);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    
    if (customer) {
      form.setFieldsValue({
        externalLevel: customer.externalLevel
      });
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    console.log('handleSubmit 被调用，表单值:', values); // 添加调试日志
    
    try {
      setLoading(true);
      
      // 从本地获取登录用户ID
      const currentUserId = getCurrentUserId();
      
      console.log('当前用户ID:', currentUserId); // 添加调试日志
      
      
      // 获取上传的文件URL列表
      const attachmentUrls = fileList.map((file: UploadFile) => file.response?.data?.url || file.url).filter(Boolean);
      console.log('附件URL列表:', attachmentUrls); // 添加调试日志
      
      // 组装后端需要的字段
      const payload = {
        customer_id: values.customerId as string,
        default_reason_id: values.default_reason_id as string,
        severity_level: values.severity as string,
        applicant_id: (currentUserId as string),
        remarks: values.remark as string || '',
        attachment_url: attachmentUrls.join(',') // 多个文件用逗号分隔
      };
      
      // 验证必填字段
      if (!payload.customer_id) {
        message.error('请选择客户');
        return;
      }
      if (!payload.default_reason_id) {
        message.error('请选择违约原因');
        return;
      }
      if (!payload.severity_level) {
        message.error('请选择严重性');
        return;
      }
      
      console.log('提交数据:', payload); // 添加调试日志
      
      console.log('开始调用API...'); // 添加调试日志
      const result = await DefaultApplicationAPI.create(payload);
      console.log('API调用结果:', result); // 添加调试日志
      
      if (result.success) {
        message.success('违约申请提交成功，等待审核');
        form.resetFields();
        setFileList([]); // 清空文件列表
        
        // 重新加载客户列表
        setTimeout(() => {
          loadInitialData();
        }, 1000);
      } else {
        message.error(result.message || '提交失败，请重试');
      }
      
    } catch (error: unknown) {
      console.error('提交失败:', error);
      const errorMessage = error instanceof Error ? error.message : '提交失败，请重试';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    action: 'http://localhost:5000/api/upload',
    fileList: fileList,
    onChange(info: { fileList: UploadFile[]; file: UploadFile }) {
      setFileList(info.fileList);
      
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
    beforeUpload: (file: File) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过10MB!');
        return false;
      }
      return true;
    },
    onRemove: (file: UploadFile) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'processing', text: '待审核' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已拒绝' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getSeverityText = (severity: string) => {
    const severityMap = {
      high: '高',
      medium: '中',
      low: '低'
    };
    return severityMap[severity as keyof typeof severityMap] || severity;
  };

  const applicationColumns = [
    {
      title: '申请编号',
      dataIndex: 'applicationId',
      key: 'applicationId',
      width: 120,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
    },
    {
      title: '违约原因',
      dataIndex: 'reasons',
      key: 'reasons',
      width: 200,
      render: (reasons: string[]) => (
        <Tooltip title={reasons.join(', ')}>
          <span>{reasons.join(', ')}</span>
        </Tooltip>
      ),
    },
    {
      title: '严重性',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: string) => getSeverityText(severity),
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '审核人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 100,
      render: (reviewer: string) => reviewer || '-',
    },
    {
      title: '审核时间',
      dataIndex: 'reviewTime',
      key: 'reviewTime',
      width: 150,
      render: (time: string) => time || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: () => (
        <Tooltip title="查看详情">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              message.info('申请详情功能开发中');
            }}
          />
        </Tooltip>
      ),
    },
  ];

  if (dataLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在加载数据...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="无法加载违约申请表单"
          description={error}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          action={
            <Button size="small" onClick={loadInitialData}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1890ff' }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          违约认定申请
        </h2>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>
          请填写违约认定申请信息，所有带 <span style={{ color: '#ff4d4f' }}>*</span> 的字段为必填项
        </p>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card 
            title="申请表单" 
            style={{ marginBottom: 24 }}
            headStyle={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                severity: 'medium'
              }}
              validateTrigger={['onBlur', 'onChange']}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="customerId"
                    label={<span>客户名称 <span style={{ color: '#ff4d4f' }}>*</span></span>}
                    rules={[
                      { required: true, message: '请选择客户' },
                      { validator: (_, value) => {
                        if (value && customers.find(c => c.id === value)?.isDefaulted) {
                          return Promise.reject(new Error('该客户已经是违约状态'));
                        }
                        return Promise.resolve();
                      }}
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder="请选择客户"
                      optionFilterProp="children"
                      onChange={handleCustomerChange}
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                      notFoundContent="没有找到匹配的客户"
                      style={{ width: '100%' }}
                    >
                      {customers.map(customer => (
                        <Option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.externalLevel})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="externalLevel"
                    label="最新外部等级"
                  >
                    <Input readOnly placeholder="选择客户后自动显示" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="default_reason_id"
                    label={<span>违约原因 <span style={{ color: '#ff4d4f' }}>*</span></span>}
                    rules={[{ required: true, message: '请选择违约原因' }]}
                  >
                    <Select
                      placeholder="请选择违约原因"
                      optionFilterProp="children"
                      notFoundContent="没有可用的违约原因"
                      style={{ width: '100%' }}
                    >
                      {reasons.map(reason => (
                        <Option key={reason.id} value={reason.id}>
                          {reason.content}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="severity"
                    label={<span>严重性 <span style={{ color: '#ff4d4f' }}>*</span></span>}
                    rules={[{ required: true, message: '请选择严重性' }]}
                  >
                    <Radio.Group>
                      {(['high', 'medium', 'low'] as const).map(value => (
                        <Radio key={value} value={value}>
                          {value === 'high' ? '高' : value === 'medium' ? '中' : '低'}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="remark"
                label="备注"
                rules={[
                  { max: 500, message: '备注不能超过500个字符' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="请输入备注信息（可选）"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item
                label="附件上传"
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />} type="dashed" style={{ width: '100%' }}>
                    选择文件
                  </Button>
                </Upload>
                <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                  支持格式：PDF、Word、Excel、图片等，单个文件不超过10MB
                </div>
              </Form.Item>

              <Divider />

              <Form.Item>
                <Space size="middle">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={loading}
                    disabled={customers.length === 0}
                    size="large"
                  >
                    提交申请
                  </Button>
                  <Button
                    icon={<SaveOutlined />}
                    onClick={() => {
                      message.info('草稿保存功能开发中');
                    }}
                    disabled={customers.length === 0}
                    size="large"
                  >
                    保存草稿
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        console.log('测试API调用...');
                        const testResult = await DefaultApplicationAPI.list();
                        console.log('测试API调用结果:', testResult);
                        message.success('API连接正常');
                      } catch (error) {
                        console.error('API测试失败:', error);
                        message.error('API连接失败，请检查后端服务');
                      }
                    }}
                    size="large"
                  >
                    测试API
                  </Button>
                  <Button
                    onClick={() => {
                      form.resetFields();
                      setFileList([]);
                    }}
                    disabled={customers.length === 0}
                    size="large"
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card 
            title="我的申请记录" 
            style={{ marginBottom: 24 }}
            headStyle={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
          >
            {applicationsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin />
              </div>
            ) : applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                暂无申请记录
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>
                    共 {applications.length} 条申请记录
                  </span>
                </div>
                <Table
                  columns={applicationColumns}
                  dataSource={applications}
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                  rowKey="applicationId"
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DefaultApplication;
