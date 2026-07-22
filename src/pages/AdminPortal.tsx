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

export const AdminPortal: React.FC = () => {
  const { diseases } = useApp();
  const [activeTab, setActiveTab] = useState<'users' | 'catalog' | 'rules' | 'audits'>('users');
  const [usersList, setUsersList] = useState<UserRow[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('*').limit(20);
      if (!error && data) {
        setUsersList(data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.name || 'Utilisateur',
          email: u.email || 'N/A',
          role: u.role || 'PUBLIC_USER',
          created_at: u.created_at || new Date().toISOString()
        })));
      } else {
        // Fallback default list
        setUsersList([
          { id: '1', name: 'Dr. Jean-Jacques Muyembe', email: 'muyembe@inrb.cd', role: 'SUPER_ADMIN', created_at: '2026-01-01' },
          { id: '2', name: 'Agent de Santé Bikoro', email: 'agent.bikoro@minsante.cd', role: 'HEALTH_AGENT', created_at: '2026-02-15' },
          { id: '3', name: 'Tech Lab INRB', email: 'lab@inrb.cd', role: 'LABORATORY', created_at: '2026-03-10' },
          { id: '4', name: 'Superviseur Équateur', email: 'sup.equateur@minsante.cd', role: 'SUPERVISOR', created_at: '2026-04-01' }
        ]);
      }
    };

    fetchUsers();
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
          { key: 'users', label: '👥 Utilisateurs RBAC' },
          { key: 'catalog', label: '🛡️ Catalogue Maladie' },
          { key: 'rules', label: '⚙️ Moteur de Règles' },
          { key: 'audits', label: '📜 Journaux Audit' }
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
          {usersList.map(u => (
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
          ))}
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
            { rule: 'Attribution automatique d\'enquêteur terrain', trigger: 'Nouveau cas d\'Ebola ou Marburg soumis', status: 'ACTIF' },
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
          {[
            { action: 'INSERT reported_cases', user: 'agent.bikoro@minsante.cd', time: 'Aujourd\'hui 14:22', status: '200 OK' },
            { action: 'UPDATE result PCR positive', user: 'lab@inrb.cd', time: 'Aujourd\'hui 12:10', status: '200 OK' },
            { action: 'UPSERT user_role -> HEALTH_AGENT', user: 'muyembe@inrb.cd', time: 'Hier 18:40', status: '200 OK' }
          ].map(log => (
            <div key={log.time} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF' }}>{log.action}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Par {log.user} • {log.time}</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--accent-mint)', fontWeight: 'bold' }}>{log.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default AdminPortal;
