import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import type { ReportedCase } from '../types';
import { newClientId } from '../lib/ids';
import { buildReportedCasePayload } from '../services/formPayload';
import { enqueueAndSync } from '../services/outboxSync';
import {
  PlusCircle, MapPin, Camera, AlertTriangle, CheckCircle,
  Loader, WifiOff
} from 'lucide-react';

interface ReportPageProps {
  onBack: () => void;
}

const SYMPTOMS_LIST = [
  'Fièvre ≥ 38°C', 'Saignements', 'Diarrhée', 'Vomissements',
  'Douleurs musculaires', 'Maux de tête sévères', 'Éruptions cutanées',
  'Fatigue extrême', 'Douleurs abdominales', 'Difficultés respiratoires'
];

type Step = 'disease' | 'patient' | 'symptoms' | 'location' | 'review' | 'done';

export const ReportPage: React.FC<ReportPageProps> = ({ onBack }) => {
  const { user, diseases, selectedDisease, isOnline, myReports, setMyReports } = useApp();
  const [step, setStep] = useState<Step>('disease');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [diseaseId, setDiseaseId] = useState(selectedDisease?.id || diseases[0]?.id || '');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedDiseaseObj = diseases.find(d => d.id === diseaseId);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const detectLocation = () => {
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocation(`GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setGeoLoading(false);
      },
      (_err) => {
        setGeoError('Localisation refusée. Saisissez manuellement.');
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const clientId = newClientId();
    const report: ReportedCase = {
      id: clientId,
      fullName: patientName,
      phone: patientPhone,
      location,
      symptoms: selectedSymptoms.join(', '),
      description,
      status: 'Suspect',
      latitude: coords?.lat,
      longitude: coords?.lon,
      diseaseId,
    };

    try {
      const payload = buildReportedCasePayload({
        clientSubmissionId: clientId,
        fullName: patientName,
        phone: patientPhone,
        symptoms: selectedSymptoms.join(', '),
        description,
        location,
        diseaseId: diseaseId || null,
        userId: user?.id,
        latitude: coords?.lat,
        longitude: coords?.lon,
      });
      const result = await enqueueAndSync('reported_cases', payload, clientId);
      if (!result.synced && !result.offline) {
        console.error('Supabase insert error:', result.error);
      }
      await db.reportedCases.put(report);
      setMyReports([report, ...myReports]);
      setStep('done');
    } catch (e) {
      console.error('Report submission error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const card = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid var(--border-color)'
  };

  const input = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    boxSizing: 'border-box' as const
  };

  const btnPrimary = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: 'var(--accent-mint)',
    color: 'var(--primary-foreground)',
    fontWeight: 'bold',
    fontSize: '15px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '16px'
  };

  if (step === 'done') {
    return (
      <div style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-alpha-20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={40} color="var(--accent-mint)" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Signalement Enregistré</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', maxWidth: '280px' }}>
          {isOnline
            ? 'Votre signalement a été transmis à l\'équipe de surveillance épidémiologique nationale. Un agent prendra contact si nécessaire.'
            : '⚠️ Hors-ligne : votre signalement est sauvegardé localement et sera synchronisé dès le retour de la connexion.'}
        </p>
        {!isOnline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: '10px', padding: '10px 16px' }}>
            <WifiOff size={16} color="var(--warning)" />
            <span style={{ fontSize: '12px', color: 'var(--warning)' }}>Synchronisation en attente</span>
          </div>
        )}
        <button onClick={onBack} style={{ ...btnPrimary, marginTop: 0, width: 'auto', padding: '12px 32px' }}>
          Retour à l'Accueil
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
          ← Retour
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Signaler un Cas Suspect</h1>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Formulaire de signalement IDSR</span>
        </div>
        {!isOnline && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontSize: '11px' }}>
            <WifiOff size={14} />
            Hors-ligne
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {(['disease', 'patient', 'symptoms', 'location', 'review'] as Step[]).map((s, i) => (
          <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step === s ? 'var(--accent-mint)' : ((['disease', 'patient', 'symptoms', 'location', 'review'] as Step[]).indexOf(step) > i ? 'var(--accent-mint)' : 'var(--border-color)') }} />
        ))}
      </div>

      {/* STEP 1: Disease */}
      {step === 'disease' && (
        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>🦠 Sélectionner la Maladie Suspectée</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {diseases.map(d => (
              <div
                key={d.id}
                onClick={() => setDiseaseId(d.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `2px solid ${diseaseId === d.id ? 'var(--accent-mint)' : 'var(--border-color)'}`,
                  backgroundColor: diseaseId === d.id ? 'var(--primary-alpha-10)' : 'var(--bg-panel)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: diseaseId === d.id ? 'var(--accent-mint)' : 'var(--text-primary)', fontSize: '14px' }}>{d.name.fr}</div>
                  {d.caseFatalityRate && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Létalité : {d.caseFatalityRate}</div>}
                </div>
                <span style={{ fontSize: '11px', backgroundColor: 'var(--primary-alpha-20)', color: 'var(--accent-mint)', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>{d.code}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep('patient')} style={btnPrimary}>Continuer →</button>
        </div>
      )}

      {/* STEP 2: Patient Info */}
      {step === 'patient' && (
        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>👤 Informations du Patient</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Nom complet *</label>
              <input
                type="text"
                placeholder="Prénom et Nom du patient"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                style={input}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Âge</label>
              <input
                type="number"
                placeholder="Âge (années)"
                value={patientAge}
                onChange={e => setPatientAge(e.target.value)}
                style={input}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Téléphone de contact</label>
              <input
                type="tel"
                placeholder="+243 XXX XXX XXX"
                value={patientPhone}
                onChange={e => setPatientPhone(e.target.value)}
                style={input}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={() => setStep('disease')} style={{ ...btnPrimary, backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', marginTop: 0, flex: 1 }}>← Retour</button>
            <button onClick={() => setStep('symptoms')} disabled={!patientName} style={{ ...btnPrimary, marginTop: 0, flex: 2, opacity: patientName ? 1 : 0.5 }}>Continuer →</button>
          </div>
        </div>
      )}

      {/* STEP 3: Symptoms */}
      {step === 'symptoms' && (
        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>🩺 Symptômes Observés</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Sélectionnez tous les symptômes présents chez {patientName}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {SYMPTOMS_LIST.map(sym => (
              <button
                key={sym}
                onClick={() => toggleSymptom(sym)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  border: `1px solid ${selectedSymptoms.includes(sym) ? 'var(--accent-mint)' : 'var(--border-color)'}`,
                  backgroundColor: selectedSymptoms.includes(sym) ? 'var(--primary-alpha-20)' : 'var(--bg-panel)',
                  color: selectedSymptoms.includes(sym) ? 'var(--accent-mint)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: selectedSymptoms.includes(sym) ? 'bold' : 'normal'
                }}
              >
                {selectedSymptoms.includes(sym) ? '✓ ' : ''}{sym}
              </button>
            ))}
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Observations complémentaires</label>
            <textarea
              placeholder="Autres observations cliniques, contacts récents avec des cas confirmés, historique de voyage..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ ...input, height: '80px', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={() => setStep('patient')} style={{ ...btnPrimary, backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', marginTop: 0, flex: 1 }}>← Retour</button>
            <button onClick={() => setStep('location')} disabled={selectedSymptoms.length === 0} style={{ ...btnPrimary, marginTop: 0, flex: 2, opacity: selectedSymptoms.length > 0 ? 1 : 0.5 }}>Continuer →</button>
          </div>
        </div>
      )}

      {/* STEP 4: Location */}
      {step === 'location' && (
        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>📍 Localisation du Cas</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Indiquez où se trouve le patient suspect.
          </p>
          <button
            onClick={detectLocation}
            disabled={geoLoading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: coords ? 'var(--primary-alpha-10)' : 'var(--bg-panel)',
              border: `1px solid ${coords ? 'var(--accent-mint)' : 'var(--border-color)'}`,
              color: coords ? 'var(--accent-mint)' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '12px',
              fontWeight: 'bold'
            }}
          >
            {geoLoading ? <Loader size={16} className="spin" /> : <MapPin size={16} />}
            {geoLoading ? 'Localisation en cours...' : coords ? '✓ Position GPS capturée' : 'Détecter ma position GPS'}
          </button>
          {geoError && <p style={{ color: 'var(--warning)', fontSize: '12px', marginBottom: '10px' }}>{geoError}</p>}

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Localisation manuelle (Province / Zone de Santé / Village)</label>
            <input
              type="text"
              placeholder="Ex: Équateur / Zone de Santé Bikoro / Village Isange"
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={input}
            />
          </div>

          {/* Photo capture */}
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Photo optionnelle (lésions, formulaire papier)</label>
            <input type="file" ref={fileRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={() => setHasPhoto(true)} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: hasPhoto ? 'var(--primary-alpha-10)' : 'var(--bg-panel)',
                border: `1px solid ${hasPhoto ? 'var(--accent-mint)' : 'var(--border-color)'}`,
                color: hasPhoto ? 'var(--accent-mint)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: hasPhoto ? 'bold' : 'normal'
              }}
            >
              <Camera size={16} />
              {hasPhoto ? '✓ Photo capturée' : 'Prendre une photo'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={() => setStep('symptoms')} style={{ ...btnPrimary, backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', marginTop: 0, flex: 1 }}>← Retour</button>
            <button onClick={() => setStep('review')} disabled={!location} style={{ ...btnPrimary, marginTop: 0, flex: 2, opacity: location ? 1 : 0.5 }}>Réviser →</button>
          </div>
        </div>
      )}

      {/* STEP 5: Review */}
      {step === 'review' && (
        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>📋 Révision du Signalement</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Maladie suspectée</div>
              <div style={{ fontWeight: 'bold', color: 'var(--accent-mint)' }}>{selectedDiseaseObj?.name.fr || 'Non sélectionnée'}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Patient</div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{patientName}</div>
              {patientPhone && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{patientPhone}</div>}
            </div>
            <div style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Symptômes ({selectedSymptoms.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {selectedSymptoms.map(s => (
                  <span key={s} style={{ fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#FC8181', padding: '2px 8px', borderRadius: '4px' }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Localisation</div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--accent-mint)" />{location}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={16} color="var(--warning)" style={{ marginTop: '1px' }} />
              <p style={{ fontSize: '12px', color: 'var(--warning)', lineHeight: '1.5', margin: 0 }}>
                Ce signalement sera transmis à l'équipe nationale de surveillance épidémiologique. Fournir de fausses informations est une infraction aux règlements sanitaires de la RDC.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setStep('location')} style={{ ...btnPrimary, backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', marginTop: 0, flex: 1 }}>← Modifier</button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ ...btnPrimary, marginTop: 0, flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? <Loader size={16} /> : <PlusCircle size={16} />}
              {isSubmitting ? 'Transmission...' : isOnline ? 'Soumettre le Signalement' : 'Sauvegarder Hors-ligne'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReportPage;
