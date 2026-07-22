import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { TestTube } from 'lucide-react';

interface InvestigationItem {
  id: string;
  case_number: string;
  patient_name: string;
  health_zone: string;
  status: string;
  investigator: string;
  assigned_at: string;
}

interface ContactItem {
  id: string;
  contact_name: string;
  phone: string;
  relation_to_case: string;
  followup_day: number;
  status: string;
}

export const HealthAgentPortal: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'investigations' | 'contacts' | 'facility_directory'>('investigations');
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);

  useEffect(() => {
    // Load investigations from reported_cases or fallback
    const loadAgentData = async () => {
      const { data: casesData } = await supabase
        .from('reported_cases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (casesData) {
        setInvestigations(casesData.map((c, i) => ({
          id: c.id,
          case_number: `INV-2026-${100 + i}`,
          patient_name: c.full_name || 'Patient Anonyme',
          health_zone: c.health_zone_name || c.province_name || 'Équateur',
          status: c.status || 'En cours',
          investigator: user?.name || 'Agent de Santé',
          assigned_at: c.created_at || new Date().toISOString()
        })));
      }

      setContacts([
        { id: '1', contact_name: 'Jean-Marc Mbala', phone: '+243 81 234 5678', relation_to_case: 'Frère du patient zero', followup_day: 14, status: 'Sous surveillance' },
        { id: '2', contact_name: 'Marie-Claire Kasonga', phone: '+243 89 765 4321', relation_to_case: 'Garde-malade', followup_day: 8, status: 'Sous surveillance' },
        { id: '3', contact_name: 'Dr. Antoine Bofunda', phone: '+243 99 111 2222', relation_to_case: 'Personnel infirmier CTE', followup_day: 3, status: 'Asymptomatique' }
      ]);
    };

    loadAgentData();
  }, [user]);

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
          <span style={{ fontSize: '10px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
            ESPACE AGENT DE SANTÉ
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IDSR Field Suite v2</span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF' }}>Enquêtes Terrain & Suivi des Contacts</h1>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-panel)', padding: '4px', borderRadius: '10px' }}>
        {[
          { key: 'investigations', label: '📋 Enquêtes (3)' },
          { key: 'contacts', label: '👥 Suivi Contacts (3)' },
          { key: 'facility_directory', label: '🏥 Annuaire CTE' }
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

      {/* TAB 1: INVESTIGATIONS */}
      {activeTab === 'investigations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {investigations.map(inv => (
            <div key={inv.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-mint)', backgroundColor: 'rgba(20, 184, 166, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                  {inv.case_number}
                </span>
                <span style={{ fontSize: '10px', color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  {inv.status}
                </span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFF', marginBottom: '4px' }}>{inv.patient_name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>📍 Zone de santé : {inv.health_zone}</p>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--accent-mint)', color: '#000', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                  Ouvrir l'Investigation
                </button>
                <button style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TestTube size={14} /> Demander Prélèvement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CONTACT TRACING */}
      {activeTab === 'contacts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {contacts.map(c => (
            <div key={c.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>{c.contact_name}</h3>
                <span style={{ fontSize: '11px', color: 'var(--accent-mint)', fontWeight: 'bold' }}>Jour {c.followup_day} / 21</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>📞 {c.phone}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Relation : {c.relation_to_case}</p>
              <button style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--accent-mint)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                Enregistrer la visite du jour (Température & Symptômes)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: FACILITY DIRECTORY */}
      {activeTab === 'facility_directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { name: 'Centre de Traitement Ebola (CTE) Bikoro', region: 'Équateur', beds: '12 / 30 lits occupés', doctor: 'Dr. Michel Lukusa' },
            { name: 'Hôpital Général de Référence Mbandaka', region: 'Équateur', beds: '5 / 15 lits occupés', doctor: 'Dr. Sophie Kabedi' },
            { name: 'Centre d\'Isolement Sanitaire Goma', region: 'Nord-Kivu', beds: '2 / 20 lits occupés', doctor: 'Dr. Jean-Pierre Mwamba' }
          ].map(f => (
            <div key={f.name} style={card}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF', marginBottom: '4px' }}>{f.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>📍 {f.region}</p>
              <p style={{ fontSize: '11px', color: 'var(--accent-mint)', fontWeight: 'bold', marginBottom: '2px' }}>🛏️ Capacités : {f.beds}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Médecin responsable : {f.doctor}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
export default HealthAgentPortal;
