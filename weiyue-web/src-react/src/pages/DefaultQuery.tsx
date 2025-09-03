import React, { useState, useEffect } from 'react';
import {
  Table,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
  message,
  Modal
} from 'antd';
import { SearchOutlined, ReloadOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons';
import type { DefaultReview, QueryParams } from '../types';
import { DefaultReviewAPI, OptionsAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const DefaultQuery: React.FC = () => {
  const [data, setData] = useState<DefaultReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DefaultReview | null>(null);
  const [searchForm] = Form.useForm();

  useEffect(() => {
    (async () => {
      const [list, statusOpts] = await Promise.all([
        DefaultReviewAPI.list(),
        OptionsAPI.status()
      ]);
      setData(list as DefaultReview[]);
      (window as any).__statusOptions = statusOpts;
    })().catch(console.error);
  }, []);

  const handleSearch = async (values: any) => {
    try {
      setLoading(true);
      
      // 处理日期范围
      if (values.dateRange) {
        values.startDate = values.dateRange[0]?.format('YYYY-MM-DD');
        values.endDate = values.dateRange[1]?.format('YYYY-MM-DD');
        delete values.dateRange;
      }
      
      // 模拟搜索API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    DefaultReviewAPI.list().then((list: any) => setData(list as DefaultReview[]));
  };

  const handleExport = async () => {
    try {
      message.loading('正在导出数据...', 0);
      
      // 模拟导出API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.destroy();
      message.success('导出成功');
      
      // 这里应该触发文件下载
      console.log('导出数据');
    } catch (error) {
      message.destroy();
      message.error('导出失败');
      console.error('导出失败:', error);
    }
  };

  const handleViewDetail = (record: DefaultReview) => {
    setCurrentRecord(record);
    setIsDetailModalVisible(true);
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
      fixed: 'left' as const,
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
      title: '认定违约原因',
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
      title: '认定申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 150,
    },
    {
      title: '认定审核时间',
      dataIndex: 'reviewTime',
      key: 'reviewTime',
      width: 150,
      render: (reviewTime: string) => reviewTime || '-',
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
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: DefaultReview) => (
        <Tooltip title="查看详情">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>违约信息查询</h2>
        <p style={{ color: '#666' }}>提供高级查询功能，支持多条件筛选和导出</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
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
              <Form.Item name="dateRange" label="申请时间范围">
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="reviewer" label="认定人">
                <Input placeholder="请输入认定人" allowClear />
              </Form.Item>
            </Col>
          </Row>
          
          <Row>
            <Col span={24}>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    loading={loading}
                  >
                    查询
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                  <Button
                    icon={<ExportOutlined />}
                    onClick={handleExport}
                  >
                    导出Excel
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
        size="small"
      />

      <Modal
        title="违约信息详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
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
                  <strong>审核状态：</strong>{getStatusTag(currentRecord.status)}
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
                  <strong>认定人：</strong>{currentRecord.reviewer || '-'}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>审核时间：</strong>{currentRecord.reviewTime || '-'}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>最新外部等级：</strong>{currentRecord.externalLevel || '-'}
                </div>
              </Col>
            </Row>
            
            <div style={{ marginBottom: 16 }}>
              <strong>认定违约原因：</strong>
              <div style={{ marginTop: 8 }}>
                {currentRecord.reasons.map((reason, index) => (
                  <Tag key={index} style={{ marginBottom: 4 }}>{reason}</Tag>
                ))}
              </div>
            </div>
            
            {currentRecord.reviewRemark && (
              <div style={{ marginBottom: 16 }}>
                <strong>审核意见：</strong>
                <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {currentRecord.reviewRemark}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DefaultQuery;
