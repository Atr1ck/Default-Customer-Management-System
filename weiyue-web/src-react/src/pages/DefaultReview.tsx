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
import type { DefaultReview } from '../types';
import { mockDefaultReviews, statusOptions } from '../services/mockData';

const { Option } = Select;

const DefaultReview: React.FC = () => {
  const [data, setData] = useState<DefaultReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DefaultReview | null>(null);
  const [reviewForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    // 模拟从API获取数据
    setData(mockDefaultReviews);
  }, []);

  const handleSearch = async (values: any) => {
    try {
      setLoading(true);
      // 模拟搜索API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 这里应该调用实际的搜索API
      console.log('搜索参数:', values);
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
    // 重新加载所有数据
    setData(mockDefaultReviews);
  };

  const handleReview = (record: DefaultReview) => {
    setCurrentRecord(record);
    reviewForm.resetFields();
    setIsReviewModalVisible(true);
  };

  const handleReviewSubmit = async (values: any) => {
    try {
      if (!currentRecord) return;
      
      setLoading(true);
      // 模拟审核API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新本地数据
      setData(prev => prev.map(item => 
        item.id === currentRecord.id 
          ? { 
              ...item, 
              status: values.status,
              reviewer: '当前用户',
              reviewTime: new Date().toLocaleString(),
              reviewRemark: values.reviewRemark
            }
          : item
      ));
      
      message.success('审核完成');
      setIsReviewModalVisible(false);
      setCurrentRecord(null);
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
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
    },
    {
      title: '违约原因',
      dataIndex: 'reasons',
      key: 'reasons',
      ellipsis: true,
      render: (reasons: string[]) => (
        <div>
          {reasons.map((reason, index) => (
            <Tag key={index} style={{ marginBottom: 4 }}>{reason}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: '严重性',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: string) => getSeverityTag(severity),
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 150,
    },
    {
      title: '审核状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: DefaultReview) => (
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
        <h2>违约认定审核</h2>
        <p style={{ color: '#666' }}>审核违约认定申请，确保信息的准确性和完整性</p>
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
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
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
        scroll={{ x: 1000 }}
      />

      <Modal
        title={currentRecord?.status === 'pending' ? '违约认定审核' : '违约认定详情'}
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
        width={600}
        destroyOnClose
      >
        {currentRecord && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>客户名称：</strong>{currentRecord.customerName}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>违约原因：</strong>
              <div style={{ marginTop: 8 }}>
                {currentRecord.reasons.map((reason, index) => (
                  <Tag key={index} style={{ marginBottom: 4 }}>{reason}</Tag>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>严重性：</strong>{getSeverityTag(currentRecord.severity)}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>申请时间：</strong>{currentRecord.applyTime}
            </div>
            
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

export default DefaultReview;
