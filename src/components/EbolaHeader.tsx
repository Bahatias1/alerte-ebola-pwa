import React from 'react';
import { Bell, ShieldAlert, Sun, Moon, ChevronDown, Activity, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface EbolaHeaderProps {
  onNavigate: (route: string) => void;
  onOpenDrawer?: () => void;
}

export const EbolaHeader: React.FC<EbolaHeaderProps> = ({ onNavigate, onOpenDrawer }) => {
  const { user, lang, theme, toggleTheme, hasUnreadAlerts, diseases, selectedDisease, setSelectedDisease } = useApp();

  const getGreeting = () => {
    if (!user) return 'Alert Disease';
    const name = user.name;
    switch (lang) {
      case 'en': return `Hello, ${name}`;
      default: return `Bonjour, ${name}`;
    }
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ADMIN_SANTE';

  return (
    <header className="glass ebola-header" style={styles.header}>
      {/* Brand, Hamburger & Disease Selector */}
      <div style={styles.left}>
        <div style={styles.brandRow}>
          {/* Mobile Hamburger Trigger */}
          {onOpenDrawer && (
            <button
              onClick={onOpenDrawer}
              className="icon-btn-touch mobile-only-menu"
              style={styles.hamburgerBtn}
              title="Ouvrir le menu"
              aria-label="Menu"
            >
              <Menu size={22} color="var(--accent-mint)" />
            </button>
          )}

          <div style={styles.badgeNidsp}>
            <Activity size={14} color="var(--accent-mint)" />
            <span>NIDSP RDC</span>
          </div>
          <span style={styles.greeting}>{getGreeting()}</span>
        </div>

        {/* Global Pathogen / Disease Selector Dropdown */}
        <div style={styles.diseaseSelectorBox}>
          <span style={styles.diseaseLabel}>Pathogène :</span>
          <select
            value={selectedDisease?.id || ''}
            onChange={(e) => {
              const found = diseases.find(d => d.id === e.target.value);
              if (found) setSelectedDisease(found);
            }}
            style={styles.diseaseSelect}
          >
            {diseases.map(d => (
              <option key={d.id} value={d.id} style={{ backgroundColor: '#091E1C', color: '#fff' }}>
                {d.code} — {d.name.fr}
              </option>
            ))}
          </select>
          <ChevronDown size={14} color="var(--accent-mint)" style={{ pointerEvents: 'none', marginLeft: '-20px' }} />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.right}>
        {/* Theme Toggler */}
        <button onClick={toggleTheme} className="icon-btn-touch" style={styles.iconBtn} title="Changer le thème">
          {theme === 'dark' ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} color="var(--primary)" />}
        </button>

        {/* Admin Link */}
        {isAdmin && (
          <button 
            onClick={() => onNavigate('admin_portal')} 
            style={styles.adminBtn}
            title="Console Admin"
          >
            <ShieldAlert size={16} />
            <span style={{ display: 'inline' }}>Admin</span>
          </button>
        )}

        {/* Notifications */}
        <button 
          onClick={() => onNavigate('notifications')} 
          className="icon-btn-touch"
          style={styles.notifBtn} 
          title="Alertes sanitaires"
        >
          <Bell size={18} />
          {hasUnreadAlerts && <span className="pulse-red" style={styles.unreadDot}></span>}
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    marginBottom: '12px',
  },
  left: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  hamburgerBtn: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    cursor: 'pointer',
    padding: '6px',
    minWidth: '40px',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeNidsp: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--accent-mint)',
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    padding: '2px 8px',
    borderRadius: '10px',
    border: '1px solid rgba(20, 184, 166, 0.3)'
  },
  greeting: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  diseaseSelectorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  diseaseLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  diseaseSelect: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--accent-mint)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '4px 22px 4px 8px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none',
    minHeight: '32px',
    appearance: 'none' as const
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBtn: {
    background: 'var(--bg-card)',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    minWidth: '40px',
    minHeight: '40px'
  },
  adminBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'var(--primary)',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    minHeight: '40px'
  },
  notifBtn: {
    position: 'relative' as const,
    background: 'var(--bg-card)',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    minWidth: '40px',
    minHeight: '40px'
  },
  unreadDot: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--emergency)',
    borderRadius: '50%',
  }
};
export default EbolaHeader;
