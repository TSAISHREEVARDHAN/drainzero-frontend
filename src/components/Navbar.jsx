import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown, Avatar, Drawer } from 'antd';
import { UserOutlined, LogoutOutlined, DashboardOutlined, HomeOutlined, EditOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, userProfile, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    if (user) navigate('/dashboard', { state: {} });
    else navigate('/');
  };

  const menuItems = [
        { key: 'profile',   label: 'Edit Profile', icon: <EditOutlined />,      onClick: () => navigate('/profile') },
    { key: 'home',      label: 'Home',          icon: <HomeOutlined />,      onClick: () => navigate('/') },
    { type: 'divider' },
    { key: 'logout',    label: 'Logout',        icon: <LogoutOutlined />,    onClick: handleLogout, danger: true },
  ];

  return (
    <>
      <nav style={{
        background    : '#FFFFFF',
        padding       : '0 20px',
        height        : 60,
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'space-between',
        boxShadow     : '0 1px 0 #E5E7EB',
        position      : 'sticky',
        top           : 0,
        zIndex        : 100,
        width         : '100%',
        boxSizing     : 'border-box',
      }}>
        {/* Logo */}
        <div onClick={handleLogoClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <img src="/DRAINZERO-LOGO.png" alt="DrainZero"
            style={{ height: 32, width: 'auto' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span style={{ fontSize: 18, fontWeight: 800, color: '#08457E', letterSpacing: -0.5, whiteSpace: 'nowrap' }}>
            Drain<span style={{ color: '#5B92E5' }}>Zero</span>
          </span>
        </div>

        {/* Desktop right side */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="navbar-desktop">
                        <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar size={32} style={{ background: '#EEF3FA', color: '#08457E', fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                  icon={<UserOutlined />}>
                  {(userProfile?.name || userProfile?.full_name || user?.email || 'U')?.[0]?.toUpperCase()}
                </Avatar>
                <span style={{ color: '#08457E', fontSize: 13, fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(userProfile?.name || userProfile?.full_name)?.split(' ')[0] || user?.email?.split('@')[0]}
                </span>
              </div>
            </Dropdown>
          </div>
        )}

        {/* Mobile hamburger */}
        {user && (
          <button
            className="navbar-mobile"
            onClick={() => setDrawerOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#08457E', fontSize: 20 }}
          >
            <MenuOutlined />
          </button>
        )}
      </nav>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={36} style={{ background: '#EEF3FA', color: '#08457E', fontWeight: 700 }}>
              {userProfile?.name?.[0]?.toUpperCase() || <UserOutlined />}
            </Avatar>
            <div>
              <div style={{ fontWeight: 700, color: '#08457E', fontSize: 15 }}>{userProfile?.name || userProfile?.full_name || 'User'}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{user?.email}</div>
            </div>
          </div>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={260}
        styles={{ body: { padding: 0 } }}
      >
        {menuItems.filter(m => m.type !== 'divider').map(item => (
          <div
            key={item.key}
            onClick={() => { item.onClick(); setDrawerOpen(false); }}
            style={{
              display    : 'flex',
              alignItems : 'center',
              gap        : 12,
              padding    : '14px 20px',
              cursor     : 'pointer',
              color      : item.danger ? '#EF4444' : '#1F2937',
              fontSize   : 15,
              borderBottom: '1px solid #F3F4F6',
            }}
          >
            <span style={{ color: item.danger ? '#EF4444' : '#5B92E5' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </Drawer>

      <style>{`
        @media (min-width: 640px) {
          .navbar-desktop { display: flex !important; }
          .navbar-mobile  { display: none  !important; }
        }
        @media (max-width: 639px) {
          .navbar-desktop { display: none  !important; }
          .navbar-mobile  { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
