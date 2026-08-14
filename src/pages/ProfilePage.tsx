import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User, Moon, Sun, Wifi, WifiOff, Bell, BellOff,
  LogOut, ShieldCheck, RefreshCw, Activity
} from 'lucide-react';

export const ProfilePage: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  const { user, logout, lang, setLang, theme, toggleTheme, isOnline, isSyncing, refreshData } = useApp();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const LANGUAGES = [
    { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
    { code: 'en' as const, label: 'English', flag: '🇬🇧' }
  ];

  const card = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden' as const
  };

  const row = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'default'
  };

  const lastRow = {
    ...row,
    borderBottom: 'none'
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* User Identity Card */}
      <div style={{
        background: 'var(--hero-gradient)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--primary-alpha-30)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          backgroundColor: 'var(--primary-alpha-20)',
          border: '2px solid var(--accent-mint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {user ? (
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-mint)' }}>
              {(user.name || 'U')[0].toUpperCase()}
            </span>
          ) : (
            <User size={28} color="var(--accent-mint)" />
          )}
        </div>

        {user ? (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.name}</h2>
            <p style={{ fontSize: '13px', color: 'var(--accent-mint)', marginBottom: '4px' }}>{user.email}</p>
            <span style={{
              fontSize: '10px', backgroundColor: 'var(--primary-alpha-20)',
              color: 'var(--accent-mint)', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold'
            }}>
              {user.role}
            </span>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>Utilisateur Anonyme</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Connectez-vous pour accéder à toutes les fonctionnalités</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => onNavigate('auth')}
                style={{
                  padding: '8px 16px', borderRadius: '8px',
                  backgroundColor: 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none',
                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Connexion
              </button>
              <button
                onClick={() => onNavigate('register')}
                style={{
                  padding: '8px 16px', borderRadius: '8px',
                  backgroundColor: 'transparent', color: 'var(--accent-mint)',
                  border: '1px solid var(--accent-mint)', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Inscription
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{
          flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '12px',
          padding: '12px', border: `1px solid ${isOnline ? 'var(--primary-alpha-30)' : 'rgba(245, 158, 11, 0.3)'}`,
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {isOnline ? <Wifi size={18} color="var(--accent-mint)" /> : <WifiOff size={18} color="var(--warning)" />}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: isOnline ? 'var(--accent-mint)' : 'var(--warning)' }}>
              {isOnline ? 'En ligne' : 'Hors-ligne'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {isOnline ? 'Synchro active' : 'Mode local'}
            </div>
          </div>
        </div>
        <button
          onClick={refreshData}
          disabled={!isOnline || isSyncing}
          style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '12px', padding: '12px 16px',
            color: 'var(--accent-mint)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold',
            opacity: (!isOnline || isSyncing) ? 0.5 : 1
          }}
        >
          <RefreshCw size={16} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          {isSyncing ? 'Synchro...' : 'Synchroniser'}
        </button>
      </div>

      {/* Language Selection */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🌐 Langue
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: lang === l.code ? 'var(--primary-alpha-15)' : 'var(--bg-card)',
                border: `1px solid ${lang === l.code ? 'var(--accent-mint)' : 'var(--border-color)'}`,
                color: lang === l.code ? 'var(--accent-mint)' : 'var(--text-secondary)',
                fontWeight: lang === l.code ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appearance & Settings */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ⚙️ Préférences
        </h3>
        <div style={card}>
          {/* Theme */}
          <div style={row}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {theme === 'dark' ? <Moon size={18} color="var(--accent-mint)" /> : <Sun size={18} color="var(--warning)" />}
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>Thème</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{theme === 'dark' ? 'Sombre (recommandé)' : 'Clair'}</div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                width: '44px', height: '24px', borderRadius: '12px',
                backgroundColor: theme === 'dark' ? 'var(--accent-mint)' : 'var(--border-color)',
                border: 'none', cursor: 'pointer', position: 'relative' as const, transition: 'background-color 0.2s'
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                backgroundColor: '#f3faff',
                position: 'absolute', top: '3px',
                left: theme === 'dark' ? '23px' : '3px',
                transition: 'left 0.2s'
              }} />
            </button>
          </div>

          {/* Notifications */}
          <div style={lastRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {notifPermission === 'granted' ? <Bell size={18} color="var(--accent-mint)" /> : <BellOff size={18} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>Notifications Push</div>
                <div style={{ fontSize: '11px', color: notifPermission === 'granted' ? 'var(--accent-mint)' : 'var(--text-muted)' }}>
                  {notifPermission === 'granted' ? 'Activées' : notifPermission === 'denied' ? 'Refusées (navigateur)' : 'Non configurées'}
                </div>
              </div>
            </div>
            {notifPermission !== 'granted' && notifPermission !== 'denied' && (
              <button
                onClick={requestNotifications}
                style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                Activer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* About NIDSP */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ℹ️ À propos
        </h3>
        <div style={card}>
          <div style={row}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} color="var(--accent-mint)" />
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>NIDSP PWA</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Portail National de Surveillance</div>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>v1.0.0</span>
          </div>
          <div style={row}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color="var(--accent-mint)" />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Partenaires</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>OMS • MSP RDC • INRB</span>
          </div>
          <div style={lastRow}>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Backend</span>
            <span style={{ fontSize: '12px', color: 'var(--accent-mint)', fontWeight: 'bold' }}>Supabase PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      {user && (
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
            border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer',
            fontWeight: 'bold', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <LogOut size={16} /> Déconnexion
        </button>
      )}
    </div>
  );
};
export default ProfilePage;
