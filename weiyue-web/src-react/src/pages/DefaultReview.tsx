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
import { DefaultReviewAPI, OptionsAPI } from '../services/api';

const { Option } = Select;

const DefaultReview: React.FC = () => {
  const [data, setData] = useState<DefaultReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DefaultReview | null>(null);
  const [reviewForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    (async () => {
      const [list, statusOpts] = await Promise.all([
        DefaultReviewAPI.list(),
        OptionsAPI.status()
      ]);
      setData(list as DefaultReview[]);
      // 保存到本地变量以渲染下拉（直接使用状态常量也可）
      (window as any).__statusOptions = statusOpts;
    })().catch(console.error);
  }, []);

  const handleSearch = async (values: {
    customerName?: string;
    status?: string;
    reviewer?: string;
    dateRange?: [any, any];
  }) => {
    try {
      setLoading(true);
      
      // 处理日期范围
      const filters: {
        customerName?: string;
        status?: 'pending' | 'approved' | 'rejected';
        startDate?: string;
        endDate?: string;
        reviewer?: string;
      } = {};
      if (values.customerName) filters.customerName = values.customerName;
      if (values.status) filters.status = values.status as 'pending' | 'approved' | 'rejected';
      if (values.reviewer) filters.reviewer = values.reviewer;
      
      if (values.dateRange && values.dateRange.length === 2) {
        filters.startDate = values.dateRange[0].format('YYYY-MM-DD');
        filters.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      
      // 调用实际的搜索API
      const result = await DefaultReviewAPI.list(filters);
      setData(result);
      message.success(`搜索完成，找到 ${result.length} 条记录`);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    searchForm.resetFields();
    // 重新加载所有数据
    try {
      setLoading(true);
      const result = await DefaultReviewAPI.list();
      setData(result);
    } catch (error) {
      console.error('重置失败:', error);
      message.error('重置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (record: DefaultReview) => {
    setCurrentRecord(record);
    reviewForm.resetFields();
    setIsReviewModalVisible(true);
  };

  const handleReviewSubmit = async (values: {
    status: 'approved' | 'rejected';
    reviewRemark: string;
  }) => {
    try {
      if (!currentRecord) return;
      
      setLoading(true);
      
      // 获取当前用户ID（从localStorage或使用默认值）
      const stored = localStorage.getItem('currentUser');
      const currentUserId = stored ? (() => { 
        try { 
          return JSON.parse(stored)?.user_id as string | undefined; 
        } catch { 
          return undefined; 
        } 
      })() : 'USER003';
      
      // 状态映射：前端状态 -> 后端状态
      const statusMap: Record<'approved' | 'rejected', string> = {
        'approved': '同意',
        'rejected': '拒绝'
      };
      
      // 调用真实的审核API
      const result = await DefaultReviewAPI.audit(currentRecord.id, {
        auditor_id: currentUserId as string,
        audit_status: statusMap[values.status],
        audit_remarks: values.reviewRemark
      });
      
      if (result.success) {
        message.success('审核完成');
        setIsReviewModalVisible(false);
        setCurrentRecord(null);
        
        // 重新加载数据以确保显示最新的审核状态
        try {
          const updatedData = await DefaultReviewAPI.list();
          setData(updatedData);
        } catch (error) {
          console.error('重新加载数据失败:', error);
          // 即使重新加载失败，也不影响审核成功的提示
        }
      } else {
        message.error(result.message || '审核失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败，请重试');
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
