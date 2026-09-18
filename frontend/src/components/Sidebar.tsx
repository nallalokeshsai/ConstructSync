import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileCheck2,
  PackageCheck,
  Scale,
  TrendingUp,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from 'antd';

export type TabKey =
  | 'dashboard'
  | 'vendors'
  | 'indents'
  | 'pos'
  | 'grn'
  | 'matching'
  | 'rates'
  | 'reports';

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  pendingIndentsCount?: number;
  discrepancyCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingIndentsCount = 0,
  discrepancyCount = 0,
}) => {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'vendors', label: 'Vendor Directory', icon: <Users size={18} /> },
    {
      key: 'indents',
      label: 'Digital Indents',
      icon: <ClipboardList size={18} />,
      badge: pendingIndentsCount > 0 ? pendingIndentsCount : undefined,
    },
    { key: 'pos', label: 'Purchase Orders', icon: <FileCheck2 size={18} /> },
    { key: 'grn', label: 'Site GRN Receipts', icon: <PackageCheck size={18} /> },
    {
      key: 'matching',
      label: '3-Way Match & Invoices',
      icon: <Scale size={18} />,
      badge: discrepancyCount > 0 ? discrepancyCount : undefined,
      badgeColor: '#ef4444',
    },
    { key: 'rates', label: 'Rate Intelligence', icon: <TrendingUp size={18} /> },
    { key: 'reports', label: 'Reports & Compliance', icon: <FileSpreadsheet size={18} /> },
  ];

  return (
    <aside
      style={{
        width: 240,
        background: '#0f172a',
        color: '#94a3b8',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1e293b',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', padding: '8px 12px', letterSpacing: 0.5 }}>
          Procurement Core
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key as TabKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#cbd5e1',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: isActive ? '#38bdf8' : '#94a3b8' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      background: item.badgeColor || '#0284c7',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 10,
                      lineHeight: 1,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status footer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #1e293b',
          background: '#0a0f1d',
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span>GSTIN & TDS Active</span>
        </div>
        <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
          Audit Integrity: 100% Verified
        </div>
      </div>
    </aside>
  );
};
