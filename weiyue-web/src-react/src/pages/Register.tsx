import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserAddOutlined, UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { UserAPI } from '../services/api';

const { Title } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string; confirm: string; real_name?: string; department?: string; email?: string; phone?: string; }) => {
    if (values.password !== values.confirm) {
      message.error('两次输入的密码不一致');
      return;
    }
    try {
      setLoading(true);
      const resp = await UserAPI.register({
        username: values.username,
        password: values.password,
        real_name: values.real_name || values.username,
        department: values.department || '',
        role: 'user',
        email: values.email || '',
        phone: values.phone || ''
      });
      if (resp.success) {
        message.success('注册成功，请登录');
        navigate('/login');
      } else {
        message.error(resp.message || '注册失败');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '注册失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: 16 }}>
      <Card style={{ width: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>创建账户</Title>
        </div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="real_name" label="真实姓名">
            <Input prefix={<UserOutlined />} placeholder="真实姓名" />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Input placeholder="部门" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }] }>
            <Input prefix={<MailOutlined />} placeholder="邮箱（可选）" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input prefix={<PhoneOutlined />} placeholder="手机号（可选）" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="confirm" label="确认密码" dependencies={["password"]} rules={[{ required: true, message: '请再次输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<UserAddOutlined />} block loading={loading}>
              注册
            </Button>
          </Form.Item>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')}>
            返回登录
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Register;


