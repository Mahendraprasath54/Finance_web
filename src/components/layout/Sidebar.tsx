import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileAddOutlined,
  BarChartOutlined,
  CreditCardOutlined,
  BellOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { ViewId } from '../common/NavigationContext';

const { Sider } = Layout;

interface SidebarProps {
  currentView: ViewId;
  onViewChange: (view: ViewId) => void;
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, collapsed }) => {
  return (
    <Sider trigger={null} collapsible collapsed={collapsed} className="bg-white shadow-lg">
      <div className="h-16 flex items-center justify-center bg-blue-600">
        <h1 className={`text-white font-bold ${collapsed ? 'text-xl' : 'text-2xl'}`}>
          {collapsed ? 'FMS' : 'Finance Management'}
        </h1>
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[currentView]}
        onClick={({ key }) => onViewChange(key as ViewId)}
        className="mt-4"
      >
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          Dashboard
        </Menu.Item>
        <Menu.Item key="users" icon={<UserOutlined />}>
          User Management
        </Menu.Item>
        <Menu.Item key="entry" icon={<FileAddOutlined />}>
          Daily Entry
        </Menu.Item>
        <Menu.Item key="reports" icon={<BarChartOutlined />}>
          Reports
        </Menu.Item>
        <Menu.Item key="payments" icon={<CreditCardOutlined />}>
          Payments
        </Menu.Item>
        <Menu.Item key="bonus" icon={<GiftOutlined />}>
          Bonus Management
        </Menu.Item>
        <Menu.Item key="notifications" icon={<BellOutlined />}>
          Notifications
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
