import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Tooltip
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DefaultReason } from '../types';
import { mockDefaultReasons } from '../services/mockData';

const DefaultReasonMaintenance: React.FC = () => {
  const [data, setData] = useState<DefaultReason[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DefaultReason | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 模拟从API获取数据
    setData(mockDefaultReasons);
  }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: DefaultReason) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
    message.success('删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingRecord) {
        // 编辑
        setData(prev => prev.map(item => 
          item.id === editingRecord.id 
            ? { ...item, ...values, updateTime: new Date().toLocaleString() }
            : item
        ));
        message.success('编辑成功');
      } else {
        // 新增
        const newRecord: DefaultReason = {
          id: Date.now().toString(),
          ...values,
          createTime: new Date().toLocaleString(),
          updateTime: new Date().toLocaleString()
        };
        setData(prev => [...prev, newRecord]);
        message.success('新增成功');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (id: string, newOrder: number) => {
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, order: newOrder } : item
    ));
  };

  const columns = [
    {
      title: '序号',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number, record: DefaultReason) => (
        <InputNumber
          min={1}
          value={order}
          onChange={(value) => handleOrderChange(record.id, value || 1)}
          style={{ width: 60 }}
        />
      ),
    },
    {
      title: '原因内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '是否启用',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: 100,
      render: (isEnabled: boolean, record: DefaultReason) => (
        <Switch
          checked={isEnabled}
          onChange={(checked) => {
            setData(prev => prev.map(item => 
              item.id === record.id ? { ...item, isEnabled: checked } : item
            ));
          }}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: DefaultReason) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个违约原因吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>违约原因维护</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新增原因
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
        }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingRecord ? '编辑违约原因' : '新增违约原因'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isEnabled: true, order: 1 }}
        >
          <Form.Item
            name="content"
            label="原因内容"
            rules={[{ required: true, message: '请输入原因内容' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入违约原因内容" />
          </Form.Item>
          
          <Form.Item
            name="order"
            label="序号"
            rules={[{ required: true, message: '请输入序号' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="isEnabled"
            label="是否启用"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DefaultReasonMaintenance;
