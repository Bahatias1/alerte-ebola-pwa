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

interface FacilityItem {
  id: string;
  name: string;
  region: string;
  beds: string;
  doctor: string;
}

export const HealthAgentPortal: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'investigations' | 'contacts' | 'facility_directory'>('investigations');
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAgentData = async () => {
      try {
        setLoading(true);
        const [
          { data: casesData },
          { data: contactsData },
          { data: centersData }
        ] = await Promise.all([
          supabase.from('reported_cases').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('investigation_contacts').select('*').limit(15),
          supabase.from('health_centers').select('id, name, province, address, available_beds, total_beds, emergency_contact').limit(15)
        ]);

        if (casesData && casesData.length > 0) {
          setInvestigations(casesData.map((c) => ({
            id: c.id,
            case_number: `#RC-${c.id.substring(0, 8).toUpperCase()}`,
            patient_name: c.full_name || '—',
            health_zone: c.location || '—',
            status: c.status || 'Nouveau',
            investigator: user?.name || '—',
            assigned_at: c.created_at || new Date().toISOString()
          })));
        } else {
          setInvestigations([]);
        }

        if (contactsData && contactsData.length > 0) {
          setContacts(contactsData.map(c => ({
            id: c.id,
            contact_name: c.full_name || 'Contact Anonyme',
            phone: c.phone || '—',
            relation_to_case: c.relationship_type || 'Contact identifié',
            followup_day: c.monitoring_day || 1,
            status: c.monitoring_status || 'Sous surveillance'
          })));
        } else {
          setContacts([]);
        }

        if (centersData && centersData.length > 0) {
          setFacilities(centersData.map(fc => ({
            id: fc.id,
            name: fc.name,
            region: fc.province || 'RDC',
            beds: `${fc.available_beds ?? 0} / ${fc.total_beds ?? 0} lits disponibles`,
            doctor: fc.emergency_contact || 'Responsable médical'
          })));
        } else {
          setFacilities([]);
        }
      } catch (e) {
        console.error('Error loading health agent portal data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadAgentData();
  }, [user]);

  const card = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid var(--border-color)'
  };

  const [selectedExitCase, setSelectedExitCase] = useState<InvestigationItem | null>(null);
  const [exitOutcome, setExitOutcome] = useState<'RECOVERED' | 'DECEASED' | 'TRANSFERRED' | 'LOST_TO_FOLLOW_UP' | 'UNKNOWN'>('RECOVERED');
  const [exitDate, setExitDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [exitFacility, setExitFacility] = useState<string>('');
  const [exitNotes, setExitNotes] = useState<string>('');
  const [exitSubmitting, setExitSubmitting] = useState<boolean>(false);
  const [exitSuccessMsg, setExitSuccessMsg] = useState<string | null>(null);

  const handleSaveExitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExitCase) return;
    setExitSubmitting(true);
    try {
      // 1. Update reported_cases status
      const statusMap: Record<string, string> = {
        RECOVERED: 'Guéri',
        DECEASED: 'Décédé',
        TRANSFERRED: 'Transféré',
        LOST_TO_FOLLOW_UP: 'Perdu de vue',
        UNKNOWN: 'Clôturé'
      };
      await supabase
        .from('reported_cases')
        .update({
          status: statusMap[exitOutcome] || 'Clôturé',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedExitCase.id);

      setExitSuccessMsg(`État de sortie enregistré pour ${selectedExitCase.patient_name} (${exitOutcome})`);
      setTimeout(() => {
        setExitSuccessMsg(null);
        setSelectedExitCase(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error saving exit status in PWA:', err);
    } finally {
      setExitSubmitting(false);
    }
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
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Enquêtes Terrain & Suivi des Contacts</h1>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-panel)', padding: '4px', borderRadius: '10px' }}>
        {[
          { key: 'investigations', label: `📋 Enquêtes (${investigations.length})` },
          { key: 'contacts', label: `👥 Suivi Contacts (${contacts.length})` },
          { key: 'facility_directory', label: `🏥 Annuaire CTE (${facilities.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              fontSize: '12px', fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              backgroundColor: activeTab === tab.key ? 'var(--accent-mint)' : 'transparent',
              color: activeTab === tab.key ? 'var(--primary-foreground)' : 'var(--text-secondary)', cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Exit Status Modal */}
      {selectedExitCase && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            ...card, width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-card)',
            display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Saisir l'État de Sortie
              </h3>
              <button onClick={() => setSelectedExitCase(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Patient : <strong style={{ color: 'var(--text-primary)' }}>{selectedExitCase.patient_name}</strong> ({selectedExitCase.case_number})
            </div>

            <form onSubmit={handleSaveExitStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Issue épidémiologique *</label>
                <select
                  value={exitOutcome}
                  onChange={(e: any) => setExitOutcome(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px' }}
                >
                  <option value="RECOVERED">GUÉRI (RECOVERED)</option>
                  <option value="DECEASED">DÉCÉDÉ (DECEASED)</option>
                  <option value="TRANSFERRED">TRANSFÉRÉ (TRANSFERRED)</option>
                  <option value="LOST_TO_FOLLOW_UP">PERDU DE VUE (LOST TO FOLLOW-UP)</option>
                  <option value="UNKNOWN">INCONNU (UNKNOWN)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Date d'événement / Clôture *</label>
                <input
                  type="date"
                  value={exitDate}
                  onChange={e => setExitDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {exitOutcome === 'RECOVERED' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Établissement de sortie / CTE</label>
                  <input
                    type="text"
                    placeholder="Ex: CTE Butembo"
                    value={exitFacility}
                    onChange={e => setExitFacility(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {exitOutcome === 'DECEASED' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Lieu du décès</label>
                  <input
                    type="text"
                    placeholder="Ex: Domicile / CTE"
                    value={exitFacility}
                    onChange={e => setExitFacility(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {exitOutcome === 'TRANSFERRED' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Destination du transfert</label>
                  <input
                    type="text"
                    placeholder="Ex: Hôpital Provincial Goma"
                    value={exitFacility}
                    onChange={e => setExitFacility(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Observations cliniques</label>
                <textarea
                  rows={2}
                  placeholder="Notes et justifications..."
                  value={exitNotes}
                  onChange={e => setExitNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              {exitSuccessMsg && (
                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                  ✓ {exitSuccessMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedExitCase(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={exitSubmitting}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  {exitSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: INVESTIGATIONS */}
      {activeTab === 'investigations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des enquêtes...</div>
          ) : investigations.length === 0 ? (
            <div style={{ ...card, padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Aucune enquête active assignée</p>
            </div>
          ) : (
            investigations.map(inv => (
              <div key={inv.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-mint)', backgroundColor: 'var(--primary-alpha-20)', padding: '2px 8px', borderRadius: '4px' }}>
                    {inv.case_number}
                  </span>
                  <span style={{ fontSize: '10px', color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    {inv.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{inv.patient_name}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>📍 Zone : {inv.health_zone}</p>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedExitCase(inv)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🏥 État de Sortie
                  </button>
                  <button style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TestTube size={14} /> Demander Prélèvement
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CONTACT TRACING */}
      {activeTab === 'contacts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des contacts...</div>
          ) : contacts.length === 0 ? (
            <div style={{ ...card, padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Aucun contact sous surveillance épidémiologique</p>
            </div>
          ) : (
            contacts.map(c => (
              <div key={c.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{c.contact_name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--accent-mint)', fontWeight: 'bold' }}>Jour {c.followup_day} / 21</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>📞 {c.phone}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Relation : {c.relation_to_case}</p>
                <button style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--accent-mint)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                  Enregistrer la visite du jour
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: FACILITY DIRECTORY */}
      {activeTab === 'facility_directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des centres de santé...</div>
          ) : facilities.length === 0 ? (
            <div style={{ ...card, padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Aucun centre de santé répertorié</p>
            </div>
          ) : (
            facilities.map(f => (
              <div key={f.id} style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{f.name}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>📍 {f.region}</p>
                <p style={{ fontSize: '11px', color: 'var(--accent-mint)', fontWeight: 'bold', marginBottom: '2px' }}>🛏️ {f.beds}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contact : {f.doctor}</p>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
export default HealthAgentPortal;
