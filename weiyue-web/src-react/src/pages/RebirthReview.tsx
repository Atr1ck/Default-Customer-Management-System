import React, { useState, useEffect } from 'react';
import {
  Table,
  Form,
  Input,
  Select,
  Button,
  Space,
  Modal,
  message,
  Tag,
  Tooltip,
  Card,
  Row,
  Col
} from 'antd';
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import type { RebirthReview } from '../types';
import { RebirthAPI, OptionsAPI } from '../services/api';

const { Option } = Select;

const RebirthReview: React.FC = () => {
  const [data, setData] = useState<RebirthReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<RebirthReview | null>(null);
  const [reviewForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    (async () => {
      const [list, statusOpts] = await Promise.all([
        RebirthAPI.listReviews(),
        OptionsAPI.status()
      ]);
      setData(list as RebirthReview[]);
      (window as any).__statusOptions = statusOpts;
    })().catch(console.error);
  }, []);

  const handleSearch = async (values: any) => {
    try {
      setLoading(true);
      const status = values.status as 'pending' | 'approved' | 'rejected' | undefined;
      const severity = values.severity as 'high' | 'medium' | 'low' | undefined;
      const range: [Dayjs, Dayjs] | undefined = values.dateRange;
      const startDate = range ? range[0].format('YYYY-MM-DD') : undefined;
      const endDate = range ? range[1].format('YYYY-MM-DD') : undefined;
      const list = await RebirthAPI.listReviewsWithFilters({ status, severity, startDate, endDate });
      setData(list as RebirthReview[]);
      message.success('搜索完成');
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    searchForm.resetFields();
    setLoading(true);
    RebirthAPI.listReviews()
      .then((list: any) => setData(list as RebirthReview[]))
      .finally(() => setLoading(false));
  };

  const handleReview = (record: RebirthReview) => {
    setCurrentRecord(record);
    reviewForm.resetFields();
    setIsReviewModalVisible(true);
  };

  const handleReviewSubmit = async (values: any) => {
    try {
      if (!currentRecord) return;
      setLoading(true);
      // 获取当前用户ID
      const stored = localStorage.getItem('currentUser');
      const currentUserId = stored ? (() => { 
        try { 
          return JSON.parse(stored)?.user_id as string | undefined; 
        } catch { 
          return undefined; 
        } 
      })() : 'USER003';
      // 状态映射
      const statusMap: Record<'approved' | 'rejected', string> = {
        approved: '同意',
        rejected: '拒绝'
      };
      await RebirthAPI.audit(currentRecord.id, {
        auditor_id: (currentUserId as string) || 'USER003',
        audit_status: statusMap[values.status as 'approved' | 'rejected'],
        audit_remarks: values.reviewRemark
      });
      message.success('审核完成');
      setIsReviewModalVisible(false);
      setCurrentRecord(null);
      // 重新加载列表
      const list = await RebirthAPI.listReviews();
      setData(list as RebirthReview[]);
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
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

  const getSeverityTag = (severity: string) => {
    const severityMap = {
      high: { color: 'red', text: '高' },
      medium: { color: 'orange', text: '中' },
      low: { color: 'green', text: '低' }
    };
    
    const { color, text } = severityMap[severity as keyof typeof severityMap] || severityMap.medium;
    return <Tag color={color}>{text}</Tag>;
  };

  const columns = [
    {
      title: '违约客户',
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
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => getSeverityTag(severity),
    },
    {
      title: '认定人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 100,
      render: (reviewer: string) => reviewer || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 150,
    },
    {
      title: '重生原因',
      dataIndex: 'rebirthReason',
      key: 'rebirthReason',
      ellipsis: true,
    },
    {
      title: '最新外部等级',
      dataIndex: 'externalLevel',
      key: 'externalLevel',
      width: 120,
      render: (externalLevel: string) => externalLevel || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: RebirthReview) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Tooltip title="审核">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleReview(record)}
              >
                审核
              </Button>
            </Tooltip>
          )}
          {record.status !== 'pending' && (
            <Tooltip title="查看详情">
              <Button
                size="small"
                onClick={() => handleReview(record)}
              >
                查看
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>违约重生审核</h2>
        <p style={{ color: '#666' }}>审核违约重生申请，评估客户是否具备重生条件</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col span={6}>
              <Form.Item name="customerName" label="客户名称">
                <Input placeholder="请输入客户名称" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="审核状态">
                <Select placeholder="请选择状态" allowClear>
                  {((window as any).__statusOptions || [
                    { label: '全部', value: '' },
                    { label: '待审核', value: 'pending' },
                    { label: '已通过', value: 'approved' },
                    { label: '已拒绝', value: 'rejected' }
                  ]).map((option: any) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="severity" label="严重程度">
                <Select placeholder="请选择严重程度" allowClear>
                  <Option value="high">高</Option>
                  <Option value="medium">中</Option>
                  <Option value="low">低</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dateRange" label="申请时间范围">
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    loading={loading}
                  >
                    搜索
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={currentRecord?.status === 'pending' ? '违约重生审核' : '违约重生详情'}
        open={isReviewModalVisible}
        onCancel={() => setIsReviewModalVisible(false)}
        footer={currentRecord?.status === 'pending' ? [
          <Button key="cancel" onClick={() => setIsReviewModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => {
              reviewForm.setFieldsValue({ status: 'rejected' });
              reviewForm.submit();
            }}
          >
            拒绝
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              reviewForm.setFieldsValue({ status: 'approved' });
              reviewForm.submit();
            }}
          >
            通过
          </Button>
        ] : [
          <Button key="close" onClick={() => setIsReviewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
        destroyOnClose
      >
        {currentRecord && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <strong>客户名称：</strong>{currentRecord.customerName}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>原违约原因：</strong>{currentRecord.originalReason}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>严重程度：</strong>{getSeverityTag(currentRecord.severity)}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>申请时间：</strong>{currentRecord.applyTime}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <strong>重生原因：</strong>{currentRecord.rebirthReason}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>最新外部等级：</strong>{currentRecord.externalLevel || '-'}
                </div>
              </Col>
            </Row>
            
            {currentRecord.status === 'pending' && (
              <Form
                form={reviewForm}
                layout="vertical"
                onFinish={handleReviewSubmit}
              >
                <Form.Item
                  name="status"
                  label="审核结果"
                  rules={[{ required: true, message: '请选择审核结果' }]}
                >
                  <Select>
                    <Option value="approved">通过</Option>
                    <Option value="rejected">拒绝</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="reviewRemark"
                  label="审核意见"
                  rules={[{ required: true, message: '请输入审核意见' }]}
                >
                  <Input.TextArea rows={4} placeholder="请输入审核意见" />
                </Form.Item>
              </Form>
            )}
            
            {currentRecord.status !== 'pending' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <strong>审核状态：</strong>{getStatusTag(currentRecord.status)}
                </div>
                {currentRecord.reviewer && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>审核人：</strong>{currentRecord.reviewer}
                  </div>
                )}
                {currentRecord.reviewTime && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>审核时间：</strong>{currentRecord.reviewTime}
                  </div>
                )}
                {currentRecord.reviewRemark && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>审核意见：</strong>{currentRecord.reviewRemark}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RebirthReview;
