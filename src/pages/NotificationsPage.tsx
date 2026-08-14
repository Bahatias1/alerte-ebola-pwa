import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';

const SEVERITY_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  'Critique': { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: <AlertTriangle size={16} />, label: 'CRITIQUE' },
  'Élevé': { color: '#F97316', bgColor: 'rgba(249, 115, 22, 0.1)', icon: <AlertTriangle size={16} />, label: 'ÉLEVÉ' },
  'Moyen': { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', icon: <Info size={16} />, label: 'MOYEN' },
  'Faible': { color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', icon: <CheckCircle size={16} />, label: 'FAIBLE' },
};

const formatRelative = (timestamp: number) => {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${Math.floor(diffHours / 24)} j`;
};

export const NotificationsPage: React.FC = () => {
  const { alerts, markAlertAsRead, hasUnreadAlerts } = useApp();
  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '2px' }}>
            Alertes & Notifications
          </h1>
          {unreadCount > 0 && (
            <span style={{
              fontSize: '11px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              padding: '2px 10px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {hasUnreadAlerts && (
          <button
            onClick={() => alerts.filter(a => !a.isRead).forEach(a => markAlertAsRead(a.id))}
            style={{
              fontSize: '12px',
              color: 'var(--accent-mint)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Realtime badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: 'var(--accent-mint)',
        backgroundColor: 'var(--primary-alpha-10)',
        border: '1px solid var(--primary-alpha-30)',
        borderRadius: '8px',
        padding: '8px 14px',
        marginBottom: '20px'
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-mint)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
        <span>Surveillance en temps réel — Abonnement Supabase Realtime actif</span>
      </div>

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Bell size={48} color="var(--border-color)" />
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Aucune alerte active</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Les alertes épidémiologiques nationales apparaîtront ici en temps réel.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map(alert => {
            const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG['Moyen'];
            return (
              <div
                key={alert.id}
                style={{
                  backgroundColor: alert.isRead ? 'var(--bg-card)' : 'var(--bg-panel)',
                  borderRadius: '14px',
                  border: `1px solid ${alert.isRead ? 'var(--border-color)' : sev.color + '40'}`,
                  padding: '14px 16px',
                  position: 'relative' as const
                }}
              >
                {/* Unread dot */}
                {!alert.isRead && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: sev.color
                  }} />
                )}

                {/* Severity badge + time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: sev.color,
                    backgroundColor: sev.bgColor,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${sev.color}40`
                  }}>
                    {sev.icon}{sev.label}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={10} />{formatRelative(alert.timestamp)}
                  </span>
                  {alert.region && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>• 📍 {alert.region}</span>}
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>{alert.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>{alert.description}</p>

                {!alert.isRead && (
                  <button
                    onClick={() => markAlertAsRead(alert.id)}
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent-mint)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle size={12} /> Marquer comme lue
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default NotificationsPage;
