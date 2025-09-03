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
  Alert
} from 'antd';
import { UploadOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import type { DefaultApplication, Customer, DefaultReason } from '../types';
import { CustomerAPI, ReasonAPI, OptionsAPI, DefaultApplicationAPI } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;

const DefaultApplication: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reasons, setReasons] = useState<DefaultReason[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    (async () => {
      const [customersRes, reasonsRes] = await Promise.all([
        CustomerAPI.list(),
        ReasonAPI.list()
      ]);
      setCustomers(customersRes as Customer[]);
      setReasons((reasonsRes as DefaultReason[]).filter(r => r.isEnabled));
    })().catch(console.error);
  }, []);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    
    if (customer) {
      form.setFieldsValue({
        externalLevel: customer.externalLevel
      });
      
      if (customer.isDefaulted) {
        message.warning('该客户已经违约，请勿重复申请');
      }
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 验证客户是否已违约
      if (selectedCustomer?.isDefaulted) {
        message.error('该客户已经违约，无法重复申请');
        return;
      }
      
      // API 调用
      await DefaultApplicationAPI.create({
        ...values,
        customerName: selectedCustomer?.name,
        status: 'pending',
        createTime: new Date().toLocaleString()
      });
      message.success('申请提交成功，等待审核');
      form.resetFields();
      setSelectedCustomer(null);
      
    } catch (error) {
      console.error('提交失败:', error);
      message.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    action: '/api/upload', // 实际的上传接口
    onChange(info: any) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>违约认定申请</h2>
        <p style={{ color: '#666' }}>请填写违约认定申请信息，所有带 * 的字段为必填项</p>
      </div>

      {selectedCustomer?.isDefaulted && (
        <Alert
          message="警告"
          description="该客户已经违约，请勿重复申请"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            severity: 'medium'
          }}
        >
          <Form.Item
            name="customerId"
            label="客户名称"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select
              showSearch
              placeholder="请选择客户"
              optionFilterProp="children"
              onChange={handleCustomerChange}
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.externalLevel})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="externalLevel"
            label="最新外部等级"
          >
            <Input readOnly />
          </Form.Item>

          <Form.Item
            name="reasons"
            label="违约原因"
            rules={[{ required: true, message: '请选择违约原因' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择违约原因"
              optionFilterProp="children"
              maxTagCount={3}
            >
              {reasons.map(reason => (
                <Option key={reason.id} value={reason.id}>
                  {reason.content}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="severity"
            label="严重性"
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

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea
              rows={4}
              placeholder="请输入备注信息（可选）"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="attachments"
            label="附件上传"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              支持格式：PDF、Word、Excel、图片等，单个文件不超过10MB
            </div>
          </Form.Item>

          <Divider />

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
                icon={<SaveOutlined />}
                onClick={() => {
                  // 保存草稿功能
                  message.info('草稿保存功能开发中');
                }}
              >
                保存草稿
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  setSelectedCustomer(null);
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DefaultApplication;
