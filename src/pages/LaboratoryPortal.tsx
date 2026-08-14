import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'results' | 'history'>('pending');

  const card = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid var(--border-color)'
  };

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const { data: samplesData, error } = await supabase
        .from('biological_samples')
        .select(`
          id,
          sample_type,
          collection_date,
          status,
          transport_status,
          laboratory_tests (
            id,
            result,
            tested_at
          )
        `)
        .order('collection_date', { ascending: false });

      if (error) throw error;

      if (samplesData && samplesData.length > 0) {
        const mapped: SampleItem[] = samplesData.map((s: any) => {
          const test = s.laboratory_tests?.[0];
          let uiStatus: 'PENDING' | 'ANALYZING' | 'POSITIVE' | 'NEGATIVE' = 'PENDING';
          if (test?.result === 'POSITIVE') uiStatus = 'POSITIVE';
          else if (test?.result === 'NEGATIVE') uiStatus = 'NEGATIVE';
          else if (s.status === 'PROCESSING' || s.transport_status === 'IN_TRANSIT') uiStatus = 'ANALYZING';

          return {
            id: s.id,
            sample_code: `LAB-${s.id.substring(0, 8).toUpperCase()}`,
            patient_name: `Patient ref #${s.id.substring(0, 5)}`,
            disease_suspected: 'Pathogène sous investigation',
            type: s.sample_type || 'Prélèvement biologique',
            collected_at: s.collection_date || 'Récemment',
            status: uiStatus
          };
        });
        setSamples(mapped);
      } else {
        setSamples([]);
      }
    } catch (e) {
      console.error('Failed to load lab samples from Supabase:', e);
      setSamples([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const updateStatus = async (id: string, newStatus: 'POSITIVE' | 'NEGATIVE') => {
    try {
      await supabase.from('laboratory_tests').insert({
        sample_id: id,
        result: newStatus,
        tested_at: new Date().toISOString()
      });
      await supabase.from('biological_samples').update({
        status: 'ANALYZED'
      }).eq('id', id);

      setSamples(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (e) {
      console.error('Failed to update sample result:', e);
    }
  };

  const filteredSamples = samples.filter(s => {
    if (activeTab === 'pending') return s.status === 'PENDING' || s.status === 'ANALYZING';
    if (activeTab === 'results') return s.status === 'POSITIVE' || s.status === 'NEGATIVE';
    return true;
  });

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
          { key: 'pending', label: `🧪 En attente (${samples.filter(s => s.status === 'PENDING' || s.status === 'ANALYZING').length})` },
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
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Chargement des échantillons biologiques...
          </div>
        ) : filteredSamples.length === 0 ? (
          <div style={{ ...card, padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Aucun échantillon biologique trouvé
            </p>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Les prélèvements transmis par les équipes d'investigation apparaîtront ici dès leur enregistrement en base.
            </span>
          </div>
        ) : (
          filteredSamples.map(sample => (
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
          ))
        )}
      </div>
    </div>
  );
};
export default LaboratoryPortal;
