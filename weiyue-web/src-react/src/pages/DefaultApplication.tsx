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
  Divider
} from 'antd';
import { UploadOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import type { DefaultApplication, Customer, DefaultReason } from '../types';
import { CustomerAPI, ReasonAPI, DefaultApplicationAPI } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;

const DefaultApplication: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reasons, setReasons] = useState<DefaultReason[]>([]);

  useEffect(() => {
    (async () => {
      const [customersRes, reasonsRes] = await Promise.all([
        CustomerAPI.list(),
        ReasonAPI.list()
      ]);
      // 只显示未违约的客户
      setCustomers((customersRes as Customer[]).filter(c => !c.isDefaulted));
      setReasons((reasonsRes as DefaultReason[]).filter(r => r.isEnabled));
    })().catch(console.error);
  }, []);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    
    if (customer) {
      form.setFieldsValue({
        externalLevel: customer.externalLevel
      });
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 从本地获取登录用户ID
      const stored = localStorage.getItem('currentUser');
      const currentUserId = stored ? (() => { try { return JSON.parse(stored)?.user_id as string | undefined; } catch { return undefined; } })() : undefined;
      if (!currentUserId) {
        message.error('请先登录后再提交违约申请');
        return;
      }
      
      // 组装后端需要的字段
      const payload = {
        customer_id: values.customerId, // 客户ID
        default_reason_id: values.default_reason_id, // 违约原因ID
        severity_level: values.severity, // 严重程度
        applicant_id: currentUserId, // 登录用户ID
        remarks: values.remark, // 备注
        attachment_url: values.attachments // 附件URL
      };
      
      await DefaultApplicationAPI.create(payload);
      message.success('申请提交成功，等待审核');
      form.resetFields();
      
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
            name="default_reason_id"
            label="违约原因"
            rules={[{ required: true, message: '请选择违约原因' }]}
          >
            <Select
              placeholder="请选择违约原因"
              optionFilterProp="children"
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
