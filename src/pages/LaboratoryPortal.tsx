import React, { useState } from 'react';

interface SampleItem {
  id: string;
  sample_code: string;
  patient_name: string;
  disease_suspected: string;
  type: string;
  collected_at: string;
  status: 'PENDING' | 'ANALYZING' | 'POSITIVE' | 'NEGATIVE';
}

export const LaboratoryPortal: React.FC = () => {
  const [samples, setSamples] = useState<SampleItem[]>([
    { id: '1', sample_code: 'LAB-2026-0881', patient_name: 'Patient #401', disease_suspected: 'Maladie à Virus Ebola', type: 'Sang veineux (EDTA)', collected_at: '2026-07-21 14:30', status: 'PENDING' },
    { id: '2', sample_code: 'LAB-2026-0882', patient_name: 'Patient #402', disease_suspected: 'Mpox (Variole du Singe)', type: 'Écouvillon de lésion', collected_at: '2026-07-21 16:15', status: 'ANALYZING' },
    { id: '3', sample_code: 'LAB-2026-0879', patient_name: 'Patient #398', disease_suspected: 'Choléra', type: 'Selles / Écouvillon rectal', collected_at: '2026-07-20 09:00', status: 'POSITIVE' },
    { id: '4', sample_code: 'LAB-2026-0878', patient_name: 'Patient #395', disease_suspected: 'Maladie à Virus Marburg', type: 'Sang veineux', collected_at: '2026-07-20 11:20', status: 'NEGATIVE' }
  ]);

  const [activeTab, setActiveTab] = useState<'pending' | 'results' | 'history'>('pending');

  const card = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid var(--border-color)'
  };

  const updateStatus = (id: string, newStatus: 'POSITIVE' | 'NEGATIVE') => {
    setSamples(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
            LABORATOIRE DE BIOLOGIE MÉDICALE & INRB
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lab Suite v2</span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF' }}>Gestion des Échantillons & Résultats PCR</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-panel)', padding: '4px', borderRadius: '10px' }}>
        {[
          { key: 'pending', label: '🧪 En attente (2)' },
          { key: 'results', label: '✅ Validation PCR' },
          { key: 'history', label: '📋 Historique Labo' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              fontSize: '12px', fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              backgroundColor: activeTab === tab.key ? '#8B5CF6' : 'transparent',
              color: activeTab === tab.key ? '#FFF' : 'var(--text-secondary)', cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {samples.filter(s => activeTab === 'pending' ? (s.status === 'PENDING' || s.status === 'ANALYZING') : true).map(sample => (
          <div key={sample.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                {sample.sample_code}
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
                color: sample.status === 'POSITIVE' ? '#EF4444' : sample.status === 'NEGATIVE' ? '#22C55E' : '#F59E0B',
                backgroundColor: sample.status === 'POSITIVE' ? 'rgba(239, 68, 68, 0.2)' : sample.status === 'NEGATIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'
              }}>
                {sample.status}
              </span>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFF', marginBottom: '4px' }}>{sample.patient_name}</h3>
            <p style={{ fontSize: '12px', color: 'var(--accent-mint)', fontWeight: 'bold', marginBottom: '2px' }}>🦠 Pathogène recherché : {sample.disease_suspected}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>🧪 Nature : {sample.type} • Prélevé le {sample.collected_at}</p>

            {(sample.status === 'PENDING' || sample.status === 'ANALYZING') && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => updateStatus(sample.id, 'POSITIVE')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  🔴 Saisir POSITIF (PCR)
                </button>
                <button
                  onClick={() => updateStatus(sample.id, 'NEGATIVE')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.4)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  🟢 Saisir NÉGATIF (PCR)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default LaboratoryPortal;
