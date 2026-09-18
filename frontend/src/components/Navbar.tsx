import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { Button, Dropdown, MenuProps, Tag, Badge, Tooltip } from 'antd';
import {
  HardHat,
  UserCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { getOfflineIndents, syncOfflineIndents } from '../utils/offlineSync';

interface NavbarProps {
  onRefresh?: () => void;
  activeProject?: string;
  onProjectChange?: (projectId: string) => void;
  projects?: any[];
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  activeProject,
  onProjectChange,
  projects = [],
}) => {
  const { user, switchPersona } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateCount = () => {
      setOfflineCount(getOfflineIndents().length);
    };
    updateCount();
    const interval = setInterval(updateCount, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const res = await syncOfflineIndents();
    setOfflineCount(getOfflineIndents().length);
    setSyncing(false);
    if (res.success && onRefresh) {
      onRefresh();
    }
  };

  const personaItems: MenuProps['items'] = DEMO_PERSONAS.map((p) => ({
    key: p.key,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
        <img
          src={p.avatar}
          alt={p.name}
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{p.name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {p.title} • <Tag color="blue" style={{ fontSize: 10 }}>{p.tag}</Tag>
          </div>
        </div>
      </div>
    ),
    onClick: () => switchPersona(p.key),
  }));

  const roleColors: Record<string, string> = {
    project_director: 'purple',
    procurement_manager: 'blue',
    site_engineer: 'orange',
    finance_controller: 'green',
    admin: 'red',
  };

  return (
    <header
      style={{
        height: 64,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand & Project Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
            }}
          >
            <HardHat size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Construct<span style={{ color: '#0284c7' }}>Sync</span>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              NIST Infra ConTech Intelligence
            </div>
          </div>
        </div>

        {/* Project Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
          <Building2 size={16} color="#64748b" />
          <select
            value={activeProject || ''}
            onChange={(e) => onProjectChange && onProjectChange(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#f8fafc',
              color: '#1e293b',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Projects (Consolidated Portfolio)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName} ({p.projectCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right side controls: Offline Sync + Persona Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Network & Offline Status */}
        {offlineCount > 0 ? (
          <Tooltip title={`${offlineCount} material indents waiting to sync from site storage`}>
            <Button
              type="primary"
              size="small"
              icon={<RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />}
              loading={syncing}
              onClick={handleSync}
              style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
            >
              Sync {offlineCount} Offline Indent{offlineCount > 1 ? 's' : ''}
            </Button>
          </Tooltip>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            {isOnline ? (
              <Tag color="success" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Wifi size={12} /> Connected
              </Tag>
            ) : (
              <Tag color="warning" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <WifiOff size={12} /> Offline Mode
              </Tag>
            )}
          </div>
        )}

        {/* Persona Switcher Menu */}
        <Dropdown menu={{ items: personaItems }} trigger={['click']} placement="bottomRight">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              borderRadius: 24,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name}
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {user?.name || 'Meena Iyer'}
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                <Tag color={roleColors[user?.role || 'project_director']} style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>
                  {user?.role?.replace('_', ' ').toUpperCase()}
                </Tag>
              </div>
            </div>
            <UserCheck size={14} color="#64748b" />
          </div>
        </Dropdown>
      </div>
    </header>
  );
};
