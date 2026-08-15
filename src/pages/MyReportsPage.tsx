import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { Activity, Clock, CheckCircle, XCircle, AlertTriangle, Loader, RefreshCw } from 'lucide-react';
import type { ReportedCase } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'nouveau': { label: 'Signalement Reçu — En attente', color: '#F59E0B', icon: <Clock size={14} /> },
  'validé': { label: 'Validé — Cas Pris en Charge', color: '#10B981', icon: <CheckCircle size={14} /> },
  'rejeté': { label: 'Invalidé / Fausse Alerte', color: '#6B7280', icon: <XCircle size={14} /> },
  'Guéri': { label: 'État de sortie : Guéri (Rétabli)', color: '#10B981', icon: <CheckCircle size={14} /> },
  'Décédé': { label: 'État de sortie : Décédé', color: '#EF4444', icon: <XCircle size={14} /> },
  'Transféré': { label: 'État de sortie : Transféré', color: '#3B82F6', icon: <Activity size={14} /> },
  'Suspect': { label: 'Suspect — En attente', color: '#F59E0B', icon: <AlertTriangle size={14} /> },
  'under_review': { label: 'En cours d\'investigation', color: '#3B82F6', icon: <Activity size={14} /> },
  'validated': { label: 'Validé — Cas Confirmé', color: '#10B981', icon: <CheckCircle size={14} /> },
  'Confirmé': { label: 'Confirmé', color: '#EF4444', icon: <CheckCircle size={14} /> },
  'rejected': { label: 'Invalidé', color: '#6B7280', icon: <XCircle size={14} /> },
  'Invalidé': { label: 'Invalidé', color: '#6B7280', icon: <XCircle size={14} /> },
  'closed': { label: 'Dossier Fermé', color: 'var(--accent-mint)', icon: <CheckCircle size={14} /> },
  'CLOSED': { label: 'Dossier Clôturé', color: 'var(--accent-mint)', icon: <CheckCircle size={14} /> },
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const MyReportsPage: React.FC = () => {
  const { user, myReports, setMyReports, isOnline } = useApp();
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportedCase | null>(null);

  const loadReports = async () => {
    if (!user || !isOnline) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reported_cases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const mapped: ReportedCase[] = data.map(r => ({
          id: r.id,
          fullName: r.full_name || '',
          phone: r.phone || '',
          location: r.health_zone_name || r.province_name || r.location_source || '',
          symptoms: r.symptoms || '',
          description: r.description || '',
          status: r.status || 'Suspect',
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
        setMyReports(mapped);
      }
    } catch (e) {
      console.error('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user, isOnline]);

  if (!user) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Activity size={48} color="var(--accent-mint)" />
        <h2 style={{ color: 'var(--text-primary)', fontSize: '18px' }}>Connexion requise</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Connectez-vous pour accéder à votre historique de signalements.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Mes Signalements</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {myReports.length} signalement{myReports.length !== 1 ? 's' : ''} enregistré{myReports.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadReports}
          disabled={loading || !isOnline}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'var(--accent-mint)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px'
          }}
        >
          {loading ? <Loader size={14} /> : <RefreshCw size={14} />}
          Actualiser
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Loader size={32} color="var(--accent-mint)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p>Chargement de vos signalements...</p>
        </div>
      ) : myReports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Activity size={48} color="var(--border-color)" />
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Aucun signalement</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Vous n'avez pas encore soumis de signalement épidémiologique.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myReports.map(report => {
            const statusConf = STATUS_CONFIG[report.status] || STATUS_CONFIG['Suspect'];
            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '14px',
                  padding: '16px',
                  border: `1px solid ${selectedReport?.id === report.id ? 'var(--accent-mint)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
              >
                {/* Row 1: Status badge + date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: statusConf.color,
                    backgroundColor: `${statusConf.color}1A`,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: `1px solid ${statusConf.color}40`
                  }}>
                    {statusConf.icon}
                    {statusConf.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} />{formatDate(report.createdAt)}
                  </div>
                </div>

                {/* Row 2: Patient info */}
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{report.fullName || 'Patient anonyme'}</h3>
                {report.location && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>📍 {report.location}</p>
                )}

                {/* Expanded detail */}
                {selectedReport?.id === report.id && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {report.symptoms && (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Symptômes signalés</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {report.symptoms.split(', ').map(s => (
                            <span key={s} style={{ fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#FC8181', padding: '2px 8px', borderRadius: '4px' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {report.description && (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Observations</div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{report.description}</p>
                      </div>
                    )}

                    {/* Status timeline */}
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Progression</div>
                      <div style={{ display: 'flex', gap: '0' }}>
                        {['Suspect', 'under_review', 'validated'].map((s) => {
                          const statuses = ['Suspect', 'under_review', 'validated', 'closed'];
                          const currentIdx = statuses.indexOf(report.status);
                          const stepIdx = statuses.indexOf(s);
                          const isDone = currentIdx >= stepIdx;
                          return (
                            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                backgroundColor: isDone ? 'var(--accent-mint)' : 'var(--border-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                {isDone && <CheckCircle size={14} color="var(--primary-foreground)" />}
                              </div>
                              <span style={{ fontSize: '9px', color: isDone ? 'var(--accent-mint)' : 'var(--text-muted)', textAlign: 'center', lineHeight: '1.2' }}>
                                {s === 'Suspect' ? 'Soumis' : s === 'under_review' ? 'Investigation' : 'Classifié'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default MyReportsPage;
