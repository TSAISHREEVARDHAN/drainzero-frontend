import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Space, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, DashboardOutlined, HomeOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ showDashboard = true }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined />, onClick: () => navigate('/dashboard', { state: location.state }) },
    { key: 'home',      label: 'Home',      icon: <HomeOutlined />,      onClick: () => navigate('/') },
    { type: 'divider' },
    { key: 'logout',    label: 'Logout',    icon: <LogoutOutlined />,    onClick: handleLogout, danger: true },
  ];

  return (
    <nav style={{
      background: '#FFFFFF',
      padding: '0 32px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 0 #E5E7EB',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{ fontSize: 20, fontWeight: 800, color: '#08457E', cursor: 'pointer', letterSpacing: -0.5 }}
      >
        Drain<span style={{ color: '#5B92E5' }}>Zero</span>
      </div>

      {/* Right side */}
      <Space size={12}>
        {showDashboard && user && (
          <Button
            icon={<DashboardOutlined />}
            onClick={() => navigate('/dashboard', { state: location.state })}
            style={{ borderRadius: 10, color: '#08457E', borderColor: '#B8C8E6', height: 36 }}
            size="small"
          >
            Dashboard
          </Button>
        )}

        {user && (
          <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar
                size={32}
                style={{ background: '#EEF3FA', color: '#08457E', fontSize: 13, fontWeight: 700 }}
                icon={<UserOutlined />}
              >
                {userProfile?.name?.[0]?.toUpperCase()}
              </Avatar>
              <span style={{ color: '#08457E', fontSize: 13, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile?.name || user?.email?.split('@')[0]}
              </span>
            </div>
          </Dropdown>
        )}
      </Space>
    </nav>
  );
};

export default Navbar;
