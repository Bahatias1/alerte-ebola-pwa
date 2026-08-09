import React from 'react';
import {
  FileText, BookOpen, Activity, User, PlusCircle, ShieldAlert,
  TestTube, Users, Settings, X, ChevronRight, PhoneCall,
  RefreshCw, Download, HelpCircle, LogOut, Home, Map, Bell, Menu, ClipboardList, Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

export type Route = 
  | 'home' 
  | 'map' 
  | 'report' 
  | 'forms' 
  | 'idsr_center'
  | 'knowledge' 
  | 'my_reports' 
  | 'notifications' 
  | 'profile' 
  | 'auth' 
  | 'register'
  | 'agent_portal'
  | 'lab_portal'
  | 'supervisor_portal'
  | 'admin_portal'
  | 'sync'
  | 'downloads'
  | 'help';

interface NavigationProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

export const NavigationBar: React.FC<NavigationProps> = ({
  currentRoute,
  onNavigate,
  isDrawerOpen,
  setIsDrawerOpen
}) => {
  const { hasUnreadAlerts, user, lang, setLang, logout, syncOfflineReports, isSyncing } = useApp();
  const role: UserRole = user?.role || 'PUBLIC_USER';

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'SUPER_ADMIN': return 'SUPER ADMIN';
      case 'ADMIN': case 'ADMIN_SANTE': return 'ADMINISTRATEUR';
      case 'SUPERVISOR': return 'SUPERVISEUR';
      case 'LABORATORY': return 'LABORATOIRE INRB';
      case 'HEALTH_AGENT': return 'AGENT DE SANTÉ';
      default: return 'CITOYEN';
    }
  };

  // ── DESKTOP SIDEBAR ITEMS (Full Navigation) ───────────────────────────
  const desktopItems: { id: Route; label: string; icon: React.ReactNode; section?: string }[] = [
    { id: 'home', label: 'Accueil Portail', icon: <Home size={20} />, section: 'PORTAIL SANITAIRE' },
    { id: 'map', label: 'Carte RDC', icon: <Map size={20} /> },
    { id: 'report', label: 'Signaler un Cas Suspect', icon: <PlusCircle size={20} /> },
    { id: 'my_reports', label: 'Mes Signalements & Investigations', icon: <Activity size={20} />, section: 'SURVEILLANCE' },
    { id: 'notifications', label: 'Alertes & Notifications', icon: <Bell size={20} /> },
  ];

  if (role === 'HEALTH_AGENT' || role === 'ADMIN' || role === 'SUPERVISOR' || role === 'SUPER_ADMIN') {
    desktopItems.push({ id: 'agent_portal', label: 'Espace Agent de Santé', icon: <Activity size={20} color="#F59E0B" />, section: 'SUITE PROFESSIONNELLE' });
  }
  if (role === 'LABORATORY' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    desktopItems.push({ id: 'lab_portal', label: 'Laboratoire INRB', icon: <TestTube size={20} color="#8B5CF6" />, section: role === 'LABORATORY' ? 'SUITE PROFESSIONNELLE' : undefined });
  }
  if (role === 'SUPERVISOR' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    desktopItems.push({ id: 'supervisor_portal', label: 'Supervision Régionale', icon: <Users size={20} color="#3B82F6" />, section: role === 'SUPERVISOR' ? 'SUITE PROFESSIONNELLE' : undefined });
  }
  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'ADMIN_SANTE') {
    desktopItems.push({ id: 'admin_portal', label: 'Console Admin NIDSP', icon: <Settings size={20} color="var(--accent-mint)" />, section: 'ADMINISTRATION' });
  }

  desktopItems.push(
    { id: 'forms', label: 'Centre IDSR & Fiches Officielles', icon: <FileText size={20} />, section: 'RESSOURCES' },
    { id: 'knowledge', label: 'Centre de Connaissances OMS', icon: <BookOpen size={20} /> },
    { id: 'profile', label: 'Profil & Paramètres', icon: <User size={20} />, section: 'MON COMPTE' }
  );

  // ── MOBILE DRAWER ITEMS — exact spec: IDSR Center, Knowledge Center, Official Forms,
  // My Investigations, Synchronization, Downloads, Settings, About, Help, Logout
  const drawerItems: { key: string; id: Route | 'action_logout' | 'action_sync'; label: string; icon: React.ReactNode; section?: string; action?: () => void }[] = [
    { key: 'idsr_center', id: 'idsr_center', label: lang === 'fr' ? 'Centre IDSR' : 'IDSR Center', icon: <ClipboardList size={20} color="var(--accent-mint)" />, section: lang === 'fr' ? 'SURVEILLANCE & FORMULAIRES' : 'SURVEILLANCE & FORMS' },
    { key: 'knowledge', id: 'knowledge', label: lang === 'fr' ? 'Centre de Connaissances' : 'Knowledge Center', icon: <BookOpen size={20} /> },
    { key: 'forms', id: 'forms', label: lang === 'fr' ? 'Formulaires Officiels' : 'Official Forms', icon: <FileText size={20} /> },
    { key: 'my_reports', id: 'my_reports', label: lang === 'fr' ? 'Mes Investigations' : 'My Investigations', icon: <Activity size={20} />, section: lang === 'fr' ? 'TERRAIN' : 'FIELD WORK' },
  ];

  if (role === 'HEALTH_AGENT' || role === 'ADMIN' || role === 'SUPERVISOR' || role === 'SUPER_ADMIN') {
    drawerItems.push({ key: 'agent_portal', id: 'agent_portal', label: lang === 'fr' ? 'Espace Agent de Santé' : 'Health Agent Space', icon: <Activity size={20} color="#F59E0B" />, section: lang === 'fr' ? 'SUITE PROFESSIONNELLE' : 'PROFESSIONAL SUITE' });
  }
  if (role === 'LABORATORY' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    drawerItems.push({ key: 'lab_portal', id: 'lab_portal', label: lang === 'fr' ? 'Laboratoire INRB' : 'INRB Laboratory', icon: <TestTube size={20} color="#8B5CF6" /> });
  }
  if (role === 'SUPERVISOR' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    drawerItems.push({ key: 'supervisor_portal', id: 'supervisor_portal', label: lang === 'fr' ? 'Supervision Régionale' : 'Regional Supervision', icon: <Users size={20} color="#3B82F6" /> });
  }
  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'ADMIN_SANTE') {
    drawerItems.push({ key: 'admin_portal', id: 'admin_portal', label: lang === 'fr' ? 'Console Admin NIDSP' : 'NIDSP Admin Console', icon: <Settings size={20} color="var(--accent-mint)" />, section: lang === 'fr' ? 'ADMINISTRATION' : 'ADMINISTRATION' });
  }

  drawerItems.push(
    { key: 'sync', id: 'action_sync', label: isSyncing ? (lang === 'fr' ? 'Synchronisation...' : 'Syncing...') : (lang === 'fr' ? 'Synchronisation' : 'Synchronization'), icon: <RefreshCw size={20} color="#3B82F6" className={isSyncing ? 'animate-spin' : ''} />, section: lang === 'fr' ? 'OUTILS' : 'TOOLS', action: syncOfflineReports },
    { key: 'downloads', id: 'downloads', label: lang === 'fr' ? 'Téléchargements' : 'Downloads', icon: <Download size={20} /> },
    { key: 'settings', id: 'profile', label: lang === 'fr' ? 'Paramètres' : 'Settings', icon: <Settings size={20} />, section: lang === 'fr' ? 'COMPTE' : 'ACCOUNT' },
    { key: 'about', id: 'help', label: lang === 'fr' ? 'À Propos' : 'About', icon: <Info size={20} /> },
    { key: 'help', id: 'help', label: lang === 'fr' ? 'Aide' : 'Help', icon: <HelpCircle size={20} /> }
  );

  if (user) {
    drawerItems.push({
      key: 'logout',
      id: 'action_logout',
      label: lang === 'fr' ? 'Déconnexion' : 'Logout',
      icon: <LogOut size={20} color="#EF4444" />,
      action: logout
    });
  }

  const handleItemClick = (routeId: string, action?: () => void, needsAuth = false) => {
    setIsDrawerOpen(false);
    if (action) {
      action();
      return;
    }
    if (routeId === 'action_sync' || routeId === 'action_logout') return;
    onNavigate(needsAuth ? 'auth' : (routeId as Route));
  };

  return (
    <>
      {/* ============ DESKTOP SIDEBAR ============ */}
      <aside className="desktop-sidebar sidebar-nav">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <ShieldAlert size={20} color="#FFF" />
          </div>
          <div>
            <div className="sidebar-brand-text">Alert Disease</div>
            <div className="sidebar-brand-sub">NIDSP • RDC • WHO</div>
          </div>
        </div>

        {/* Nav items with section dividers */}
        <nav style={{ flex: 1, paddingTop: '8px' }}>
          {desktopItems.map((item) => {
            const isActive = currentRoute === item.id;
            const showBell = item.id === 'notifications' && hasUnreadAlerts;
            const needsAuth = ['my_reports'].includes(item.id) && !user;

            return (
              <React.Fragment key={item.id}>
                {item.section && (
                  <div className="sidebar-section-label">{item.section}</div>
                )}
                <button
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleItemClick(item.id, undefined, needsAuth)}
                  title={needsAuth ? 'Connexion requise' : item.label}
                  style={{ minHeight: '44px' }}
                >
                  <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                    {showBell && (
                      <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: 'var(--emergency)'
                      }} />
                    )}
                  </span>
                  <span>{item.label}</span>
                  {needsAuth && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>🔒</span>}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Emergency contact */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            URGENCE ÉPIDÉMIOLOGIQUE
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--emergency)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PhoneCall size={14} /> 0800 00 000
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Appel gratuit • 24h/24 RDC</div>
        </div>
      </aside>

      {/* ============ MOBILE ANIMATED DRAWER & BACKDROP ============ */}
      <div
        className={`drawer-backdrop ${isDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      />

      <aside className={`mobile-drawer ${isDrawerOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} color="var(--accent-mint)" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFF' }}>Alert Disease</div>
              <div style={{ fontSize: '10px', color: 'var(--accent-mint)', fontWeight: '700' }}>NIDSP RDC • WHO</div>
            </div>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="icon-btn-touch"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Identity Banner in Drawer */}
        <div style={{ padding: '14px 20px', backgroundColor: 'rgba(20, 184, 166, 0.08)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(20, 184, 166, 0.2)', border: '1px solid var(--accent-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent-mint)' }}>
            {user ? user.name[0].toUpperCase() : <User size={20} />}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>{user ? user.name : 'Utilisateur Public'}</div>
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(20, 184, 166, 0.2)', color: 'var(--accent-mint)', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
              {getRoleLabel(role)}
            </span>
          </div>
        </div>

        {/* Drawer Scrollable Menu (No Home, Map, Alerts) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {drawerItems.map((item) => {
            const isActive = currentRoute === item.id;
            const needsAuth = ['my_reports'].includes(item.id) && !user;

            return (
              <React.Fragment key={item.key}>
                {item.section && (
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 20px 4px' }}>
                    {item.section}
                  </div>
                )}
                <button
                  onClick={() => handleItemClick(item.id, item.action, needsAuth)}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    backgroundColor: isActive ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                    color: item.id === 'action_logout' ? '#EF4444' : (isActive ? 'var(--accent-mint)' : 'var(--text-primary)'),
                    border: 'none',
                    borderLeft: isActive ? '4px solid var(--accent-mint)' : '4px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? 'bold' : '500',
                    textAlign: 'left' as const
                  }}
                >
                  <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {needsAuth ? <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>🔒</span> : <ChevronRight size={16} color="var(--text-muted)" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)' }}>
          {/* Language Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setLang('fr')}
              style={{ flex: 1, minHeight: '36px', borderRadius: '6px', backgroundColor: lang === 'fr' ? 'var(--accent-mint)' : 'var(--bg-card)', color: lang === 'fr' ? '#000' : 'var(--text-secondary)', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => setLang('en')}
              style={{ flex: 1, minHeight: '36px', borderRadius: '6px', backgroundColor: lang === 'en' ? 'var(--accent-mint)' : 'var(--bg-card)', color: lang === 'en' ? '#000' : 'var(--text-secondary)', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
            >
              🇬🇧 English
            </button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--emergency)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PhoneCall size={12} /> 0800 00 000 (Urgence 24/7 RDC)
          </div>
        </div>
      </aside>

      {/* ============ MOBILE BOTTOM NAVIGATION (5 Primary Actions) ============ */}
      <nav className="mobile-nav bottom-nav">
        {/* 1. Accueil */}
        <button
          className={`bottom-nav-item ${currentRoute === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <Home size={20} />
          <span>Accueil</span>
        </button>

        {/* 2. Carte RDC */}
        <button
          className={`bottom-nav-item ${currentRoute === 'map' ? 'active' : ''}`}
          onClick={() => onNavigate('map')}
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <Map size={20} />
          <span>Carte</span>
        </button>

        {/* 3. Central FAB: Signaler un cas */}
        <button
          onClick={() => onNavigate('report')}
          className="fab-report-btn"
          title="Signaler un cas suspect"
          aria-label="Signaler un cas"
        >
          <PlusCircle size={26} color="#000" />
        </button>

        {/* 4. Alertes */}
        <button
          className={`bottom-nav-item ${currentRoute === 'notifications' ? 'active' : ''}`}
          onClick={() => onNavigate('notifications')}
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <span style={{ position: 'relative' }}>
            <Bell size={20} />
            {hasUnreadAlerts && (
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--emergency)' }} />
            )}
          </span>
          <span>Alertes</span>
        </button>

        {/* 5. Menu Drawer Trigger (Menu) */}
        <button
          className={`bottom-nav-item ${isDrawerOpen ? 'active' : ''}`}
          onClick={() => setIsDrawerOpen(true)}
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
};
