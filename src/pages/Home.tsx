import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  AlertTriangle, 
  Map, 
  FileText, 
  PlusCircle, 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Hospital
} from 'lucide-react';
import { formatDateTime } from '../utils/provinceHelper';

interface HomeProps {
  onNavigate: (route: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { alerts, officialSources, epidemicStats, selectedDisease } = useApp();
  const activeAlertCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. National Outbreak & Disease Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0B4F48 0%, #063A35 100%)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(20, 184, 166, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-mint)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Surveillance Épidémiologique Nationale RDC
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF', marginTop: '4px' }}>
              {selectedDisease ? selectedDisease.name.fr : 'Maladie à Virus Ebola'}
            </h1>
          </div>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', borderRadius: '20px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} color="#EF4444" />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#EF4444' }}>VIGILANCE ACTIVÉE</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.5' }}>
          Système intégré de détection précoce des épidémies et de riposte rapide OMS / Ministère de la Santé RDC.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={() => onNavigate('report')}
            style={{
              flex: 1,
              backgroundColor: 'var(--accent-mint)',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 'bold',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={18} />
            <span>Signaler un cas suspect</span>
          </button>

          <button
            onClick={() => onNavigate('map')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFF',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontWeight: 'bold',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Map size={18} color="var(--accent-mint)" />
            <span>Carte RDC</span>
          </button>
        </div>
      </div>

      {/* 2. Key Indicators Grid (Live KPIs from Supabase) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1f))', gap: '12px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cas Confirmés</span>
            <TrendingUp size={16} color="var(--accent-mint)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFF' }}>{epidemicStats?.totalCases ?? '142'}</div>
          <span style={{ fontSize: '10px', color: 'var(--accent-mint)' }}>Cumul épidémique</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Guérisons</span>
            <ShieldCheck size={16} color="var(--accent-mint)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-mint)' }}>{epidemicStats?.recovered ?? '98'}</div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Prise en charge</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Alertes Actives</span>
            <AlertTriangle size={16} color="var(--emergency)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--emergency)' }}>{activeAlertCount}</div>
          <span style={{ fontSize: '10px', color: 'var(--emergency)' }}>Investigation requise</span>
        </div>
      </div>

      {/* 3. Core NIDSP Modules (Grid of 4 main services) */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Services du Portail Sanitaire
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div
            onClick={() => onNavigate('forms')}
            style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
          >
            <FileText size={24} color="var(--accent-mint)" style={{ marginBottom: '8px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>Fiches IDSR</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Formulaires officiels épidémiologiques OMS/RDC.</p>
          </div>

          <div
            onClick={() => onNavigate('my_reports')}
            style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
          >
            <Activity size={24} color="var(--accent-mint)" style={{ marginBottom: '8px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>Mes Signalements</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Suivi du statut et de la classification des cas.</p>
          </div>

          <div
            onClick={() => onNavigate('knowledge')}
            style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
          >
            <BookOpen size={24} color="var(--accent-mint)" style={{ marginBottom: '8px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>Centre de Connaissances</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Guides OMS, protocoles et définitions de cas.</p>
          </div>

          <div
            onClick={() => onNavigate('map')}
            style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
          >
            <Hospital size={24} color="var(--accent-mint)" style={{ marginBottom: '8px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>Centres de Santé</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Localisation des centres de traitement (CTE).</p>
          </div>
        </div>
      </div>

      {/* 4. Official News & Bulletins Stream */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Communiqués Officiels OMS & MINSANTE</h2>
          <span style={{ fontSize: '11px', color: 'var(--accent-mint)', cursor: 'pointer' }} onClick={() => onNavigate('knowledge')}>Voir tout</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {officialSources.slice(0, 3).map(source => (
            <div
              key={source.id}
              style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '14px', border: '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', backgroundColor: 'rgba(20, 184, 166, 0.2)', color: 'var(--accent-mint)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  {source.sourceType || 'OMS RDC'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  {formatDateTime(source.fetchedAt)}
                </span>
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF', marginBottom: '4px' }}>{source.title}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{source.content.substring(0, 120)}...</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
export default Home;
