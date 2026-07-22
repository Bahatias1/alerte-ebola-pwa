import React, { useState } from 'react';

export const SupervisorPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'teams' | 'approvals'>('dashboard');

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
          <span style={{ fontSize: '10px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
            SUPERVISION ÉPIDÉMIOLOGIQUE RÉGIONALE
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supervisor Suite v2</span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF' }}>Tableau de Bord & Validation des Équipes</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-panel)', padding: '4px', borderRadius: '10px' }}>
        {[
          { key: 'dashboard', label: '📊 KPIs Régionaux' },
          { key: 'teams', label: '👥 Équipes Terrain (4)' },
          { key: 'approvals', label: '✅ File d\'Approbation (3)' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              fontSize: '12px', fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              backgroundColor: activeTab === tab.key ? '#3B82F6' : 'transparent',
              color: activeTab === tab.key ? '#FFF' : 'var(--text-secondary)', cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: REGIONAL DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={card}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cas sous Investigation</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B', marginTop: '4px' }}>14</div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Province de l'Équateur</span>
            </div>
            <div style={card}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Prélèvements Validés</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-mint)', marginTop: '4px' }}>28</div>
              <span style={{ fontSize: '10px', color: 'var(--accent-mint)' }}>Taux de complétude 94%</span>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF', marginBottom: '10px' }}>📈 Taux d'Attaque par Zone de Santé (IDSR View)</h3>
            {[
              { zone: 'Zone de Santé Bikoro', rate: '4.2 %', cases: '18 cas', risk: 'HIGH' },
              { zone: 'Zone de Santé Mbandaka', rate: '2.1 %', cases: '9 cas', risk: 'MEDIUM' },
              { zone: 'Zone de Santé Iboko', rate: '1.0 %', cases: '4 cas', risk: 'LOW' }
            ].map(z => (
              <div key={z.zone} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF' }}>{z.zone}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{z.cases}</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: z.risk === 'HIGH' ? '#EF4444' : z.risk === 'MEDIUM' ? '#F59E0B' : '#22C55E' }}>
                  {z.rate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNED TEAMS */}
      {activeTab === 'teams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { name: 'Équipe d\'Intervention Rapide A (EIR-A)', zone: 'Bikoro', leader: 'Dr. Michel Lukusa', status: 'En mission terrain' },
            { name: 'Équipe de Suivi des Contacts B', zone: 'Mbandaka', leader: 'Inf. Jean Mulumba', status: 'Actif' },
            { name: 'Équipe d\'Assainissement & PCI', zone: 'Iboko', leader: 'Tech. Pierre Kasa', status: 'En attente' }
          ].map(t => (
            <div key={t.name} style={card}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF', marginBottom: '4px' }}>{t.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>📍 Zone : {t.zone} • Responsable : {t.leader}</p>
              <span style={{ fontSize: '10px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: APPROVAL QUEUE */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { id: '1', title: 'Rapport d\'Investigation Fiche #INV-2026-101', agent: 'Agent de Santé Bikoro', date: 'Aujourd\'hui 11:20' },
            { id: '2', title: 'Clôture Suivi Contact #CT-9902', agent: 'Agent de Santé Mbandaka', date: 'Aujourd\'hui 09:45' }
          ].map(app => (
            <div key={app.id} style={card}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF', marginBottom: '4px' }}>{app.title}</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Soumis par {app.agent} • {app.date}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: 'var(--accent-mint)', color: '#000', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                  Approuver & Fermer
                </button>
                <button style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '12px', cursor: 'pointer' }}>
                  Demander Complément
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default SupervisorPortal;
