import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { VendorsView } from './views/VendorsView';
import { IndentsView } from './views/IndentsView';
import { PurchaseOrdersView } from './views/PurchaseOrdersView';
import { GRNView } from './views/GRNView';
import { ThreeWayMatchView } from './views/ThreeWayMatchView';
import { RateIntelligenceView } from './views/RateIntelligenceView';
import { ReportsView } from './views/ReportsView';
import api from './services/api';
import { ConfigProvider } from 'antd';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [activeProject, setActiveProject] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);

  // Cross-view state handoffs
  const [prefillIndentForPO, setPrefillIndentForPO] = useState<any | null>(null);
  const [prefillPOForGRN, setPrefillPOForGRN] = useState<any | null>(null);

  // Badge counts
  const [pendingIndentsCount, setPendingIndentsCount] = useState<number>(0);
  const [discrepancyCount, setDiscrepancyCount] = useState<number>(0);

  const fetchGlobalStats = async () => {
    try {
      const pRes = await api.get('/projects');
      setProjects(pRes.data.projects);

      const indRes = await api.get('/indents?approvalStatus=pending');
      setPendingIndentsCount(indRes.data.indents.length);

      const invRes = await api.get('/invoices?threeWayMatchStatus=mismatch');
      setDiscrepancyCount(invRes.data.invoices.length);
    } catch (err) {
      console.error('Error fetching global stats:', err);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const handleConvertToPO = (indent: any) => {
    setPrefillIndentForPO(indent);
    setActiveTab('pos');
  };

  const handleNavigateToGRN = (po: any) => {
    setPrefillPOForGRN(po);
    setActiveTab('grn');
  };

  const handleNavigateToMatch = (grn: any) => {
    setActiveTab('matching');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onRefresh={fetchGlobalStats}
        activeProject={activeProject}
        onProjectChange={(pId) => setActiveProject(pId)}
        projects={projects}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t)}
          pendingIndentsCount={pendingIndentsCount}
          discrepancyCount={discrepancyCount}
        />

        <main style={{ flex: 1, padding: 24, overflowY: 'auto', background: '#f8fafc' }}>
          {activeTab === 'dashboard' && (
            <DashboardView
              projectId={activeProject}
              onNavigate={(tab) => setActiveTab(tab as TabKey)}
            />
          )}

          {activeTab === 'vendors' && <VendorsView />}

          {activeTab === 'indents' && (
            <IndentsView
              projectId={activeProject}
              onRefreshStats={fetchGlobalStats}
              onConvertToPO={handleConvertToPO}
            />
          )}

          {activeTab === 'pos' && (
            <PurchaseOrdersView
              projectId={activeProject}
              prefillIndent={prefillIndentForPO}
              onClearPrefill={() => setPrefillIndentForPO(null)}
              onNavigateToGRN={handleNavigateToGRN}
            />
          )}

          {activeTab === 'grn' && (
            <GRNView
              prefillPO={prefillPOForGRN}
              onClearPrefill={() => setPrefillPOForGRN(null)}
              onNavigateToMatch={handleNavigateToMatch}
            />
          )}

          {activeTab === 'matching' && <ThreeWayMatchView />}

          {activeTab === 'rates' && <RateIntelligenceView />}

          {activeTab === 'reports' && <ReportsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0284c7',
          borderRadius: 8,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      }}
    >
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ConfigProvider>
  );
}
