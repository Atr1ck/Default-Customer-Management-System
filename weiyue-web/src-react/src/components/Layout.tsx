import React, { useState } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearCurrentUser, getCurrentUser } from '../utils/auth';

const { Header, Sider, Content } = Layout;

interface LayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '原因维护',
    },
    {
      key: '/default-application',
      icon: <FileTextOutlined />,
      label: '违约认定申请',
    },
    {
      key: '/default-review',
      icon: <CheckCircleOutlined />,
      label: '违约认定审核',
    },
    {
      key: '/default-query',
      icon: <SearchOutlined />,
      label: '违约信息查询',
    },
    {
      key: '/rebirth-application',
      icon: <ReloadOutlined />,
      label: '违约重生申请',
    },
    {
      key: '/rebirth-review',
      icon: <CheckCircleOutlined />,
      label: '违约重生审核',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '违约统计',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      clearCurrentUser();
      navigate('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 12 : 16,
          fontWeight: 'bold'
        }}>
          {collapsed ? '违约' : '违约客户管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: 18, cursor: 'pointer' }
            })}
            <span style={{ marginLeft: 16, fontSize: 16, fontWeight: 'bold' }}>
              违约客户管理系统
            </span>
          </div>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{(getCurrentUser()?.real_name as string) || '管理员'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
