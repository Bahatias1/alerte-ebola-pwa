import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface AuditRow {
  id: string;
  action: string;
  user: string;
  time: string;
  status: string;
}

export const AdminPortal: React.FC = () => {
  const { diseases } = useApp();
  const [activeTab, setActiveTab] = useState<'users' | 'catalog' | 'rules' | 'audits'>('users');
  const [usersList, setUsersList] = useState<UserRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [
          { data: uData },
          { data: aData }
        ] = await Promise.all([
          supabase.from('users').select('*').limit(20),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20)
        ]);

        if (uData && uData.length > 0) {
          setUsersList(uData.map((u: any) => ({
            id: u.id,
            name: u.full_name || u.name || 'Utilisateur',
            email: u.email || '—',
            role: u.role || 'PUBLIC_USER',
            created_at: u.created_at || new Date().toISOString()
          })));
        } else {
          setUsersList([]);
        }

        if (aData && aData.length > 0) {
          setAuditLogs(aData.map((a: any) => ({
            id: a.id,
            action: a.action || 'Événement système',
            user: a.actor_id || a.user_id || 'Système',
            time: a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : 'Récemment',
            status: 'Enregistré'
          })));
        } else {
          setAuditLogs([]);
        }
      } catch (e) {
        console.error('Error fetching admin portal data:', e);
        setUsersList([]);
        setAuditLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const card = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid var(--border-color)'
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', backgroundColor: 'rgba(20, 184, 166, 0.2)', color: 'var(--accent-mint)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
            CONSOLE ADMINISTRATION NIDSP
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enterprise Console v2.4</span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF' }}>Gestion des Rôles (RBAC), Pathogènes & Règles</h1>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-panel)', padding: '4px', borderRadius: '10px' }}>
        {[
          { key: 'users', label: `👥 Utilisateurs (${usersList.length})` },
          { key: 'catalog', label: `🛡️ Catalogue (${diseases.length})` },
          { key: 'rules', label: '⚙️ Règles Métier' },
          { key: 'audits', label: `📜 Audit (${auditLogs.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              fontSize: '12px', fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              backgroundColor: activeTab === tab.key ? 'var(--accent-mint)' : 'transparent',
              color: activeTab === tab.key ? '#000' : 'var(--text-secondary)', cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: USERS RBAC */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des utilisateurs...</div>
          ) : usersList.length === 0 ? (
            <div style={{ ...card, padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Aucun utilisateur enregistré dans la base</p>
            </div>
          ) : (
            usersList.map(u => (
              <div key={u.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>{u.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</p>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px',
                  color: u.role === 'SUPER_ADMIN' ? '#EC4899' : u.role === 'HEALTH_AGENT' ? '#F59E0B' : u.role === 'LABORATORY' ? '#8B5CF6' : 'var(--accent-mint)',
                  backgroundColor: u.role === 'SUPER_ADMIN' ? 'rgba(236, 72, 153, 0.2)' : u.role === 'HEALTH_AGENT' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(20, 184, 166, 0.2)'
                }}>
                  {u.role}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: DISEASE CATALOG */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {diseases.map(d => (
            <div key={d.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFF' }}>{d.name.fr}</h3>
                <span style={{ fontSize: '10px', backgroundColor: 'rgba(20, 184, 166, 0.2)', color: 'var(--accent-mint)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  {d.code}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Famille : {d.family || 'Pathogène prioritaire'}</p>
              {d.caseFatalityRate && <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: 'bold', marginTop: '2px' }}>Taux de Létalité : {d.caseFatalityRate}</p>}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: RULES ENGINE */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { rule: 'Déclenchement automatique d\'alerte sanitaire', trigger: '3 cas suspects dans la même Zone de Santé en < 48h', status: 'ACTIF' },
            { rule: 'Attribution automatique d\'enquêteur terrain', trigger: 'Nouveau cas soumis', status: 'ACTIF' },
            { rule: 'Notification SMS / Push d\'Urgence OMS', trigger: 'Validation cas positif par laboratoire INRB', status: 'ACTIF' }
          ].map(r => (
            <div key={r.rule} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>{r.rule}</h3>
                <span style={{ fontSize: '10px', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  {r.status}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Trigger : {r.trigger}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des journaux...</div>
          ) : auditLogs.length === 0 ? (
            <div style={{ ...card, padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Aucun journal d'audit disponible</p>
            </div>
          ) : (
            auditLogs.map(log => (
              <div key={log.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF' }}>{log.action}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Par {log.user} • {log.time}</div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--accent-mint)', fontWeight: 'bold' }}>{log.status}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
export default AdminPortal;
