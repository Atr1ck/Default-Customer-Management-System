import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Card,
  Space,
  Tag,
  message,
  Tooltip,
  Row,
  Col,
  Divider
} from 'antd';
import { ReloadOutlined, FileTextOutlined, SendOutlined } from '@ant-design/icons';
import type { RebirthApplication, Customer } from '../types';
import { CustomerAPI, RebirthAPI } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const RebirthApplication: React.FC = () => {
  const [defaultedCustomers, setDefaultedCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<RebirthApplication[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [customers, apps, reasons] = await Promise.all([
        CustomerAPI.list(),
        RebirthAPI.listApplications(),
        RebirthAPI.reasons()
      ]);
      setDefaultedCustomers((customers as Customer[]).filter(c => c.isDefaulted));
      setApplications(apps as RebirthApplication[]);
      (window as any).__rebirthReasons = (reasons as any[]).map(r => r.label);
    })().catch(console.error);
  }, []);

  const handleApply = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (!selectedCustomer) return;
      
      setLoading(true);
      const created = await RebirthAPI.createApplication({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        originalReason: '经营不善导致资金链断裂',
        severity: 'high',
        rebirthReason: values.rebirthReason,
        status: 'pending',
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      });
      setApplications(prev => [...prev, created as RebirthApplication]);
      message.success('重生申请提交成功，等待审核');
      setIsModalVisible(false);
      setSelectedCustomer(null);
      form.resetFields();
      
    } catch (error) {
      console.error('提交失败:', error);
      message.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      pending: { color: 'processing', text: '待审核' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已拒绝' }
    };
    
    const { color, text } = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Tag color={color}>{text}</Tag>;
  };

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '外部等级',
      dataIndex: 'externalLevel',
      key: 'externalLevel',
      width: 100,
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 100,
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Customer) => (
        <Space size="small">
          <Tooltip title="申请重生">
            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleApply(record)}
            >
              申请重生
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const applicationColumns = [
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
    },
    {
      title: '原违约原因',
      dataIndex: 'originalReason',
      key: 'originalReason',
      ellipsis: true,
    },
    {
      title: '重生原因',
      dataIndex: 'rebirthReason',
      key: 'rebirthReason',
      ellipsis: true,
    },
    {
      title: '申请状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>违约重生申请</h2>
        <p style={{ color: '#666' }}>为已违约客户申请重生，恢复其正常经营状态</p>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="违约客户列表"
            extra={
              <span style={{ fontSize: 12, color: '#666' }}>
                共 {defaultedCustomers.length} 个违约客户
              </span>
            }
          >
            <Table
              columns={columns}
              dataSource={defaultedCustomers}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card
            title="重生申请记录"
            extra={
              <span style={{ fontSize: 12, color: '#666' }}>
                共 {applications.length} 条申请记录
              </span>
            }
          >
            <Table
              columns={applicationColumns}
              dataSource={applications}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="违约重生申请"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {selectedCustomer && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4>客户信息</h4>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>客户名称：</strong>{selectedCustomer.name}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>外部等级：</strong>{selectedCustomer.externalLevel}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>行业：</strong>{selectedCustomer.industry}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>区域：</strong>{selectedCustomer.region}
                  </div>
                </Col>
              </Row>
            </div>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="rebirthReason"
                label="重生原因"
                rules={[{ required: true, message: '请选择重生原因' }]}
              >
                <Select placeholder="请选择重生原因">
                  {((window as any).__rebirthReasons || []).map((reason: string, index: number) => (
                    <Option key={index} value={reason}>
                      {reason}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="remark"
                label="备注说明"
              >
                <TextArea
                  rows={4}
                  placeholder="请输入备注说明（可选）"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={loading}
                  >
                    提交申请
                  </Button>
                  <Button
                    onClick={() => {
                      setIsModalVisible(false);
                      setSelectedCustomer(null);
                      form.resetFields();
                    }}
                  >
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RebirthApplication;
