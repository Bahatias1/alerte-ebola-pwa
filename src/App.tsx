import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { EbolaHeader } from './components/EbolaHeader';
import { NavigationBar, type Route } from './components/NavigationBar';
import { Onboarding } from './pages/Onboarding';
import { Auth } from './pages/Auth';
import { Register } from './pages/Register';
import { RoleBasedDashboard } from './components/RoleBasedDashboard';
import { MapPage } from './pages/MapPage';
import { ReportPage } from './pages/ReportPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { FormsPage } from './pages/FormsPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HealthAgentPortal } from './pages/HealthAgentPortal';
import { LaboratoryPortal } from './pages/LaboratoryPortal';
import { SupervisorPortal } from './pages/SupervisorPortal';
import { AdminPortal } from './pages/AdminPortal';
import './index.css';

const MainApp: React.FC = () => {
  const [route, setRoute] = useState<Route>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  useEffect(() => {
    const done = localStorage.getItem('onboarding_finished');
    if (done === 'true') setHasCompletedOnboarding(true);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_finished', 'true');
    setHasCompletedOnboarding(true);
  };

  const navigate = (r: string) => {
    setIsDrawerOpen(false);
    setRoute(r as Route);
  };

  if (!hasCompletedOnboarding) {
    return <Onboarding onFinished={handleOnboardingComplete} />;
  }

  const renderPage = () => {
    switch (route) {
      case 'home':              return <RoleBasedDashboard onNavigate={navigate} />;
      case 'map':               return <MapPage />;
      case 'report':            return <ReportPage onBack={() => setRoute('home')} />;
      case 'my_reports':        return <MyReportsPage />;
      case 'forms':             return <FormsPage />;
      case 'knowledge':         return <KnowledgePage />;
      case 'notifications':     return <NotificationsPage />;
      case 'profile':           return <ProfilePage onNavigate={navigate} />;
      case 'auth':              return <Auth onNavigate={navigate} />;
      case 'register':          return <Register onNavigate={navigate} />;
      case 'agent_portal':      return <HealthAgentPortal />;
      case 'lab_portal':        return <LaboratoryPortal />;
      case 'supervisor_portal': return <SupervisorPortal />;
      case 'admin_portal':      return <AdminPortal />;
      default:                  return <RoleBasedDashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-container">
      {/* NavigationBar handles Desktop Sidebar, Mobile Drawer & Mobile Bottom Nav */}
      <NavigationBar
        currentRoute={route}
        onNavigate={setRoute}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top Header */}
        {route !== 'auth' && route !== 'register' && (
          <EbolaHeader
            onNavigate={navigate}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}

        {/* Page Content View */}
        <main className="app-main animate-fade">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
