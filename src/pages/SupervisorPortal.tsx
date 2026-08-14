import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface ZoneRiskItem {
  zone: string;
  rate: string;
  cases: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ApprovalItem {
  id: string;
  title: string;
  agent: string;
  date: string;
}

export const SupervisorPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'teams' | 'approvals'>('dashboard');
  const [casesCount, setCasesCount] = useState<number>(0);
  const [samplesCount, setSamplesCount] = useState<number>(0);
  const [zoneRisks, setZoneRisks] = useState<ZoneRiskItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const card = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid var(--border-color)'
  };

  useEffect(() => {
    const loadSupervisorData = async () => {
      try {
        setLoading(true);
        const [
          { count: repCount },
          { count: bioCount },
          { data: zonesData },
          { data: subsData }
        ] = await Promise.all([
          supabase.from('reported_cases').select('*', { count: 'exact', head: true }),
          supabase.from('biological_samples').select('*', { count: 'exact', head: true }),
          supabase.from('zones').select('id, name, region, risk_level').limit(10),
          supabase.from('form_submissions').select('id, submitted_at, form_data').limit(10)
        ]);

        setCasesCount(repCount || 0);
        setSamplesCount(bioCount || 0);

        if (zonesData && zonesData.length > 0) {
          setZoneRisks(zonesData.map((z: any) => {
            const riskLevel = typeof z.risk_level === 'number' ? z.risk_level : 1;
            const risk: 'HIGH' | 'MEDIUM' | 'LOW' = riskLevel >= 7 ? 'HIGH' : riskLevel >= 4 ? 'MEDIUM' : 'LOW';
            return {
              zone: z.name ? `Zone de Santé ${z.name}` : `Zone ${z.region || 'RDC'}`,
              rate: `Risque ${riskLevel}/10`,
              cases: `${z.region || 'Province RDC'}`,
              risk
            };
          }));
        } else {
          setZoneRisks([]);
        }

        if (subsData && subsData.length > 0) {
          setApprovals(subsData.map((s: any) => {
            const d = typeof s.form_data === 'string' ? JSON.parse(s.form_data) : s.form_data;
            return {
              id: s.id,
              title: `Rapport IDSR #${s.id.substring(0, 8)}`,
              agent: d?.investigator_name || 'Agent de Santé',
              date: s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('fr-FR') : 'Récemment'
            };
          }));
        } else {
          setApprovals([]);
        }
      } catch (e) {
        console.error('Error loading supervisor data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadSupervisorData();
  }, []);

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
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Tableau de Bord & Validation des Équipes</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-panel)', padding: '4px', borderRadius: '10px' }}>
        {[
          { key: 'dashboard', label: '📊 KPIs Régionaux' },
          { key: 'teams', label: '👥 Équipes Terrain' },
          { key: 'approvals', label: `✅ File d'Approbation (${approvals.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              fontSize: '12px', fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              backgroundColor: activeTab === tab.key ? 'var(--chart-2)' : 'transparent',
              color: activeTab === tab.key ? 'var(--primary-foreground)' : 'var(--text-secondary)', cursor: 'pointer'
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
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B', marginTop: '4px' }}>
                {loading ? '...' : casesCount}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Base de données nationale</span>
            </div>
            <div style={card}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Prélèvements Enregistrés</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-mint)', marginTop: '4px' }}>
                {loading ? '...' : samplesCount}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--accent-mint)' }}>Traçabilité laboratoire</span>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '10px' }}>📈 Niveaux de Risque par Zone de Santé (IDSR View)</h3>
            {zoneRisks.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                Aucune zone de santé enregistrée.
              </p>
            ) : (
              zoneRisks.map(z => (
                <div key={z.zone} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{z.zone}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{z.cases}</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: z.risk === 'HIGH' ? '#EF4444' : z.risk === 'MEDIUM' ? '#F59E0B' : '#22C55E' }}>
                    {z.rate}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNED TEAMS */}
      {activeTab === 'teams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={card}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px 0' }}>
              Les déploiements d'équipes opérationnelles sont gérés dynamiquement depuis le portail de commandement central.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: APPROVAL QUEUE */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {approvals.length === 0 ? (
            <div style={{ ...card, padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Aucun rapport en attente d'approbation</p>
            </div>
          ) : (
            approvals.map(app => (
              <div key={app.id} style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{app.title}</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Soumis par {app.agent} • {app.date}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                    Approuver & Fermer
                  </button>
                  <button style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' }}>
                    Demander Complément
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
export default SupervisorPortal;
