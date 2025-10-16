import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  theme,
  Breadcrumb,
  Space,
  Badge,
  Tooltip
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  BugOutlined,
  RobotOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  TeamOutlined,
  ControlOutlined,
  CheckSquareOutlined,
  MessageOutlined,
  PictureOutlined,
  FileAddOutlined,
  PlayCircleOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { useUserStore, useAppStore } from '../../utils/store';
import { authApi } from '../../services';
import { UserRole } from '../../types';

const { Header, Sider, Content } = Layout;

// 菜单配置
const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
    roles: []
  },
  {
    key: '/ai-chat',
    icon: <MessageOutlined />,
    label: 'AI 智能助手',
    roles: []
  },
  {
    key: '/projects',
    icon: <ProjectOutlined />,
    label: '项目管理',
    roles: []
  },
  {
    key: '/requirements',
    icon: <FileTextOutlined />,
    label: '需求管理',
    roles: []
  },
  {
    key: '/test-cases',
    icon: <CheckSquareOutlined />,
    label: '测试用例',
    roles: [],
    children: [
      {
        key: '/test-cases/list',
        icon: <CheckSquareOutlined />,
        label: '测试用例管理',
        roles: []
      },
      {
        key: '/test-cases/ai-generate',
        icon: <RobotOutlined />,
        label: 'AI测试用例生成',
        roles: []
      }
    ]
  },
  {
    key: '/ui-automation',
    icon: <RobotOutlined />,
    label: 'UI自动化测试',
    roles: [UserRole.ADMIN, UserRole.TEST_MANAGER, UserRole.TESTER],
    children: [
      {
        key: '/ui-automation/image-analysis',
        icon: <PictureOutlined />,
        label: 'UI自动化图片分析',
        roles: [UserRole.ADMIN, UserRole.TEST_MANAGER, UserRole.TESTER]
      },
      {
        key: '/ui-automation/case-generate',
        icon: <FileAddOutlined />,
        label: 'UI自动化用例生成',
        roles: [UserRole.ADMIN, UserRole.TEST_MANAGER, UserRole.TESTER]
      },
      {
        key: '/ui-automation/case-execute',
        icon: <PlayCircleOutlined />,
        label: 'UI自动化用例执行',
        roles: [UserRole.ADMIN, UserRole.TEST_MANAGER, UserRole.TESTER]
      }
    ]
  },
  {
    key: '/api-automation',
    icon: <ApiOutlined />,
    label: '接口自动化测试',
    roles: [UserRole.ADMIN, UserRole.TEST_MANAGER, UserRole.TESTER]
  },
  {
    key: '/defects',
    icon: <BugOutlined />,
    label: '缺陷分析',
    roles: []
  },
  {
    key: '/performance',
    icon: <BarChartOutlined />,
    label: '性能测试',
    roles: [UserRole.ADMIN, UserRole.TEST_MANAGER, UserRole.TESTER]
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
    roles: [UserRole.ADMIN],
    children: [
      {
        key: '/settings/users',
        icon: <TeamOutlined />,
        label: '用户管理',
        roles: [UserRole.ADMIN]
      },
      {
        key: '/settings/system',
        icon: <ControlOutlined />,
        label: '系统配置',
        roles: [UserRole.ADMIN]
      }
    ]
  }
];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();
  const { collapsed, setCollapsed } = useAppStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 过滤菜单项（根据用户角色）
  const filterMenuItems = (items: any[]): any[] => {
    return items.filter(item => {
      if (item.roles && item.roles.length > 0) {
        return item.roles.includes(user?.role) || user?.is_superuser;
      }
      return true;
    }).map(item => ({
      ...item,
      children: item.children ? filterMenuItems(item.children) : undefined
    }));
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile')
    },
    {
      type: 'divider' as const,
      key: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        authApi.logout();
      }
    }
  ];

  // 生成面包屑
  const generateBreadcrumb = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbItems = [
      {
        title: '首页',
        href: '/dashboard'
      }
    ];

    pathSnippets.forEach((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const menuItem = findMenuItemByKey(filteredMenuItems, url);
      if (menuItem) {
        breadcrumbItems.push({
          title: menuItem.label,
          href: url
        });
      }
    });

    return breadcrumbItems;
  };

  // 查找菜单项
  const findMenuItemByKey = (items: any[], key: string): any => {
    for (const item of items) {
      if (item.key === key) {
        return item;
      }
      if (item.children) {
        const found = findMenuItemByKey(item.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="dark"
        width={256}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold'
        }}>
          {collapsed ? 'API' : 'API测试平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filteredMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Breadcrumb items={generateBreadcrumb()} />
          </Space>
          
          <Space>
            <Tooltip title="通知">
              <Badge count={0} size="small">
                <Button type="text" icon={<BellOutlined />} />
              </Badge>
            </Tooltip>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  src={user?.avatar} 
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span>{user?.full_name || user?.username}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '16px',
          padding: '24px',
          background: colorBgContainer,
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
