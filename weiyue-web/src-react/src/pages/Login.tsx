import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, UserOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserAPI } from '../services/api';
import { saveCurrentUser } from '../utils/auth';

const { Title, Paragraph } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const resp = await UserAPI.login(values.username, values.password);
      if ((resp as unknown as { success: boolean }).success) {
        const data = (resp as unknown as { data?: Record<string, unknown> }).data || {};
        saveCurrentUser(data);
        message.success('登录成功');
        const from = (location.state as { from?: string } | null)?.from || '/';
        navigate(from, { replace: true });
      } else {
        const msg = (resp as unknown as { message?: string }).message || '用户名或密码错误';
        message.error(msg);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '登录失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: 16 }}>
      <Card style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>违约客户管理系统</Title>
          <Paragraph style={{ margin: 0, color: '#666' }}>请登录后继续</Paragraph>
        </div>
        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />} block loading={loading}>
              登录
            </Button>
          </Form.Item>
          <Form.Item>
            <Button type="link" icon={<UserAddOutlined />} block onClick={() => navigate('/register')}>
              还没有账号？去注册
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;


