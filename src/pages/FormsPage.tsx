import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import {
  FileText, ExternalLink, Loader, Search,
  ChevronRight, ChevronLeft, CheckCircle, AlertTriangle,
  Printer, Send, ClipboardList, BookOpen, FlaskConical
} from 'lucide-react';
import { OfficialFormPdfGenerator } from '../components/OfficialFormPdfGenerator';
import { canAccessOfficialForms } from '../lib/roles';
import { newClientId } from '../lib/ids';
import {
  buildFormSubmissionPayload,
  buildMveInsertPayload,
  missingRequiredFields,
} from '../services/formPayload';
import { enqueueAndSync } from '../services/outboxSync';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FieldDef {
  id: string;
  label: { fr: string; en: string };
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea' | 'tristate';
  required?: boolean;
  options?: { value: string; label: { fr: string; en: string } }[];
  conditional?: { field: string; value: string };
  hint?: { fr: string; en: string };
}

interface SectionDef {
  id: string;
  title: { fr: string; en: string };
  fields: FieldDef[];
}

interface FormTemplate {
  id: string;
  code: string;
  title: { fr: string; en: string };
  disease_id?: string;
  version?: number;
  is_printable?: boolean;
  schema_json?: { sections?: SectionDef[]; target_table?: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CASE_DEFINITIONS = [
  {
    code: 'EBOV',
    name: 'Maladie à Virus Ebola (MVE)',
    suspect: [
      'Fièvre ≥ 38°C d\'apparition brutale',
      'ET au moins un signe : céphalées, myalgie, fatigue, vomissements, diarrhées, douleurs abdominales, hémorragies inexpliquées',
      'ET contact avec cas probable/confirmé dans les 21 jours précédents',
    ],
    probable: ['Cas suspect décédé sans prélèvement biologique'],
    confirmed: ['Cas suspect confirmé en laboratoire (RT-PCR, ELISA ou isolement viral)'],
    lab: 'Prélèvement sanguin → INRB Kinshasa ou laboratoire habilité OMS',
    cfrRange: '50–90%',
    color: '#EF4444'
  },
  {
    code: 'MPOX',
    name: 'Variole du Singe (Mpox)',
    suspect: [
      'Éruption cutanée inexpliquée (maculopapuleuse, vésiculeuse ou pustuleuse)',
      'ET fièvre, adénopathies, céphalées ou myalgies',
    ],
    probable: ['Critères suspect + lien épidémiologique avec cas confirmé'],
    confirmed: ['RT-PCR orthopoxvirus positif sur prélèvement de lésion'],
    lab: 'Écouvillonnage de lésion cutanée → INRB / laboratoire agréé',
    cfrRange: '1–10%',
    color: '#F59E0B'
  },
  {
    code: 'CHOLERA',
    name: 'Choléra',
    suspect: [
      'Diarrhée aqueuse abondante et aiguë chez un patient ≥ 2 ans',
      'ET/OU vomissements en phase aiguë',
    ],
    probable: ['Cas suspect avec lien épidémiologique à une source ou zone connue'],
    confirmed: ['Culture ou PCR Vibrio cholerae O1/O139 positive'],
    lab: 'Selles fraîches ou écouvillon rectal → laboratoire provincial',
    cfrRange: '1–5%',
    color: '#3B82F6'
  },
  {
    code: 'MEASLES',
    name: 'Rougeole',
    suspect: [
      'Fièvre et éruption maculopapuleuse généralisée',
      'ET toux ou coryza ou conjonctivite',
    ],
    probable: ['Cas suspect avec lien épidémiologique à un cas confirmé'],
    confirmed: ['IgM positif ou PCR rougeole positive'],
    lab: 'Sérum / écouvillon nasopharyngé → laboratoire provincial / INRB',
    cfrRange: '<1–5%',
    color: '#7C3AED'
  }
];

// ─── Tristate Radio Component ────────────────────────────────────────────────

const TristateField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  lang: string;
}> = ({ label, value, onChange, lang }) => {
  const opts = lang === 'fr'
    ? [{ v: 'OUI', l: 'Oui' }, { v: 'NON', l: 'Non' }, { v: 'INC', l: 'Inc.' }]
    : [{ v: 'OUI', l: 'Yes' }, { v: 'NON', l: 'No' }, { v: 'INC', l: 'Unk.' }];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', gap: '8px' }}>
        {opts.map(o => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
              border: '1.5px solid',
              borderColor: value === o.v
                ? (o.v === 'OUI' ? '#22C55E' : o.v === 'NON' ? '#EF4444' : '#6B7280')
                : 'var(--border-color)',
              backgroundColor: value === o.v
                ? (o.v === 'OUI' ? 'rgba(34,197,94,0.2)' : o.v === 'NON' ? 'rgba(239,68,68,0.2)' : 'rgba(107,114,128,0.2)')
                : 'transparent',
              color: value === o.v
                ? (o.v === 'OUI' ? '#22C55E' : o.v === 'NON' ? '#EF4444' : '#9CA3AF')
                : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Dynamic Form Field Renderer ────────────────────────────────────────────

const FormField: React.FC<{
  field: FieldDef;
  value: string;
  onChange: (id: string, val: string) => void;
  lang: string;
}> = ({ field, value, onChange, lang }) => {
  const label = typeof field.label === 'string'
    ? field.label
    : (field.label?.[lang as 'fr' | 'en'] || field.label?.fr || field.id);

  const [locating, setLocating] = useState(false);

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    backgroundColor: 'var(--bg-panel)', border: '1.5px solid var(--border-color)',
    color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box' as const,
    outline: 'none', transition: 'border-color 0.2s'
  };

  const handleDetectGPS = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coordsStr = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
          onChange(field.id, coordsStr);
          setLocating(false);
        },
        _err => {
          onChange(field.id, `-4.325000, 15.322200`);
          setLocating(false);
        }
      );
    } else {
      onChange(field.id, `-4.325000, 15.322200`);
      setLocating(false);
    }
  };

  if (field.type === 'tristate') {
    return (
      <TristateField
        label={label}
        value={value}
        onChange={v => onChange(field.id, v)}
        lang={lang}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1, paddingRight: '12px' }}>{label}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[{ v: 'true', l: lang === 'fr' ? 'Oui' : 'Yes' }, { v: 'false', l: lang === 'fr' ? 'Non' : 'No' }].map(o => (
            <button key={o.v} onClick={() => onChange(field.id, o.v)}
              style={{
                padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                border: '1.5px solid',
                borderColor: value === o.v ? (o.v === 'true' ? '#22C55E' : '#EF4444') : 'var(--border-color)',
                backgroundColor: value === o.v ? (o.v === 'true' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)') : 'transparent',
                color: value === o.v ? (o.v === 'true' ? '#22C55E' : '#EF4444') : 'var(--text-muted)',
                cursor: 'pointer'
              }}>
              {o.l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          {label}{field.required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
        <select value={value} onChange={e => onChange(field.id, e.target.value)} style={inputStyle}>
          <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
          {field.options?.map(o => (
            <option key={o.value} value={o.value}>
              {typeof o.label === 'string' ? o.label : (o.label?.[lang as 'fr' | 'en'] || o.label?.fr || o.value)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if ((field.type as string) === 'radio') {
    return (
      <div>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          {label}{field.required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {field.options?.map(o => (
            <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="radio"
                name={field.id}
                value={o.value}
                checked={value === o.value}
                onChange={e => onChange(field.id, e.target.value)}
              />
              {typeof o.label === 'string' ? o.label : (o.label?.[lang as 'fr' | 'en'] || o.label?.fr || o.value)}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if ((field.type as string) === 'checkbox' || (field.type as string) === 'multiselect') {
    const selectedVals = value ? value.split(',') : [];
    const handleToggle = (optVal: string) => {
      const updated = selectedVals.includes(optVal)
        ? selectedVals.filter(v => v !== optVal)
        : [...selectedVals, optVal];
      onChange(field.id, updated.join(','));
    };

    return (
      <div>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          {label}{field.required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {field.options?.map(o => (
            <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                value={o.value}
                checked={selectedVals.includes(o.value)}
                onChange={() => handleToggle(o.value)}
              />
              {typeof o.label === 'string' ? o.label : (o.label?.[lang as 'fr' | 'en'] || o.label?.fr || o.value)}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if ((field.type as string) === 'gps' || (field.type as string) === 'location') {
    return (
      <div>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          {label}{field.required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={value}
            onChange={e => onChange(field.id, e.target.value)}
            placeholder="ex: -1.680000, 29.220000"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={handleDetectGPS}
            style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {locating ? 'GPS...' : '📍 GPS'}
          </button>
        </div>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          {label}{field.required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
        <textarea
          value={value}
          onChange={e => onChange(field.id, e.target.value)}
          rows={3}
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
        />
      </div>
    );
  }

  return (
    <div>
      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
        {label}{field.required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      <input
        type={
          field.type === 'number' ? 'number' :
          field.type === 'date' ? 'date' :
          (field.type as string) === 'time' ? 'time' :
          (field.type as string) === 'datetime' ? 'datetime-local' : 'text'
        }
        value={value}
        onChange={e => onChange(field.id, e.target.value)}
        style={inputStyle}
        placeholder={field.hint ? field.hint[lang as 'fr' | 'en'] : undefined}
      />
    </div>
  );
};

// ─── Form Filler Component ────────────────────────────────────────────────────

const FormFiller: React.FC<{
  template: FormTemplate;
  lang: string;
  user: any;
  diseaseId?: string | null;
  diseaseCode?: string | null;
  onBack: () => void;
  onSubmitted: (offline: boolean) => void;
  onPreviewPdf: (data: Record<string, string>) => void;
}> = ({ template, lang, user, diseaseId, diseaseCode, onBack, onSubmitted, onPreviewPdf }) => {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const draftKey = `nidsp_draft_${template.id}`;

  // Restore Draft on Mount & Auto-fill investigator details
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        setDraftRestored(true);
        setTimeout(() => setDraftRestored(false), 4000);
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        investigator_name: prev.investigator_name || user.name || '',
        investigator_role: prev.investigator_role || user.role || 'Investigateur Santé',
        investigator_phone: prev.investigator_phone || user.phone || '',
        investigator_email: prev.investigator_email || user.email || '',
        investigator_health_zone: prev.investigator_health_zone || user.healthZone || 'Kinshasa',
        investigator_facility: prev.investigator_facility || user.organization || 'Centre de Santé de Référence'
      }));
    }
  }, [user, template.id, draftKey]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  };

  const sections = template.schema_json?.sections || [];
  const currentSection = sections[sectionIdx];
  const isLast = sectionIdx === sections.length - 1;
  const isFirst = sectionIdx === 0;

  const handleChange = useCallback((id: string, val: string) => {
    setFormData(prev => ({ ...prev, [id]: val }));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const missing = missingRequiredFields(sections, formData);
      if (missing.length > 0) {
        throw new Error(
          lang === 'fr'
            ? `Champs obligatoires manquants : ${missing.join(', ')}`
            : `Required fields missing: ${missing.join(', ')}`
        );
      }

      const targetTable = template.schema_json?.target_table === 'mve_alert_notifications'
        ? 'mve_alert_notifications'
        : 'form_submissions';
      const clientSubmissionId = newClientId();

      const payload = targetTable === 'mve_alert_notifications'
        ? buildMveInsertPayload({
            formData,
            sections,
            userId: user?.id,
            clientSubmissionId,
          })
        : buildFormSubmissionPayload({
            templateId: template.id,
            templateCode: template.code,
            templateVersion: template.version,
            formData,
            userId: user?.id,
            userName: user?.name,
            diseaseId: diseaseId || template.disease_id || null,
            diseaseCode,
            clientSubmissionId,
          });

      const result = await enqueueAndSync(targetTable, payload, clientSubmissionId);
      if (!result.synced && !result.offline) {
        throw new Error(result.error || 'Erreur lors de la soumission');
      }

      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore storage errors
      }

      onSubmitted(result.offline);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const getVisibleFields = (section: SectionDef) =>
    section.fields.filter(f => {
      if (!f.conditional) return true;
      return formData[f.conditional.field] === f.conditional.value;
    });

  if (!currentSection) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
        >
          <ChevronLeft size={14} /> {lang === 'fr' ? 'Retour' : 'Back'}
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {typeof template.title === 'string' ? template.title : (template.title?.[lang as 'fr' | 'en'] || template.title?.fr || template.code)}
          </h2>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {template.code} {template.version ? `v${template.version}` : ''} — Section {sectionIdx + 1}/{sections.length}
          </div>
        </div>
        <button
          onClick={handleSaveDraft}
          style={{ backgroundColor: draftSaved ? 'rgba(34,197,94,0.2)' : 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: draftSaved ? '#22C55E' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
        >
          {draftSaved ? '✓ Enregistré' : '💾 Brouillon'}
        </button>
        <button
          onClick={() => onPreviewPdf(formData)}
          style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'var(--accent-mint)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Printer size={14} /> PDF
        </button>
      </div>

      {/* Draft Restored Alert Banner */}
      {draftRestored && (
        <div style={{ backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', color: '#60A5FA', fontSize: '11px' }}>
          ℹ️ Brouillon précédent restauré automatiquement.
        </div>
      )}

      {/* Progress Bar */}
      {sections.length > 1 && (
        <div style={{ height: '4px', backgroundColor: 'var(--bg-panel)', borderRadius: '2px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '2px', backgroundColor: 'var(--accent-mint)',
            width: `${((sectionIdx + 1) / sections.length) * 100}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      {/* Section Title */}
      <div style={{ backgroundColor: 'var(--primary-alpha-12)', border: '1px solid var(--primary-alpha-30)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-mint)', margin: 0 }}>
          {typeof currentSection.title === 'string' ? currentSection.title : (currentSection.title?.[lang as 'fr' | 'en'] || currentSection.title?.fr || '')}
        </h3>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        {getVisibleFields(currentSection).map(field => (
          <FormField
            key={field.id}
            field={field}
            value={formData[field.id] || ''}
            onChange={handleChange}
            lang={lang}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '10px 14px', marginTop: '12px', color: '#EF4444', fontSize: '12px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', position: 'sticky', bottom: 0, backgroundColor: 'var(--bg-dark)', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
        {!isFirst && (
          <button
            onClick={() => setSectionIdx(i => i - 1)}
            style={{ flex: 1, padding: '13px', borderRadius: '10px', backgroundColor: 'var(--bg-panel)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <ChevronLeft size={16} /> {lang === 'fr' ? 'Précédent' : 'Previous'}
          </button>
        )}
        {!isLast ? (
          <button
            onClick={() => setSectionIdx(i => i + 1)}
            style={{ flex: 2, padding: '13px', borderRadius: '10px', backgroundColor: 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {lang === 'fr' ? 'Section Suivante' : 'Next Section'} <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 2, padding: '13px', borderRadius: '10px', backgroundColor: submitting ? '#4B5563' : 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.2s' }}
          >
            {submitting ? (
              <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {lang === 'fr' ? 'Envoi...' : 'Sending...'}</>
            ) : (
              <><Send size={16} /> {lang === 'fr' ? 'Soumettre la Fiche' : 'Submit Form'}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main FormsPage Component ─────────────────────────────────────────────────

export const FormsPage: React.FC<{ initialTab?: 'forms' | 'definitions' | 'protocols' }> = ({ initialTab = 'forms' }) => {
  const { lang, user, selectedDisease, diseases } = useApp();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'forms' | 'definitions' | 'protocols'>(initialTab);
  const [search, setSearch] = useState('');
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedOffline, setSubmittedOffline] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (!error && data) {
        const mapped: FormTemplate[] = data.map((t: any) => ({
          id: t.id,
          code: t.code,
          title: t.title || { fr: t.code, en: t.code },
          disease_id: t.disease_id,
          version: t.version,
          is_printable: t.is_printable,
          schema_json: t.schema_json
        }));
        setTemplates(mapped);
      }
      setLoading(false);
    };
    loadTemplates();
  }, []);

  const filteredTemplates = templates.filter(t => {
    const titleFr = t.title?.fr || '';
    const titleEn = t.title?.en || '';
    const s = search.toLowerCase();
    const matchesSearch =
      titleFr.toLowerCase().includes(s) ||
      titleEn.toLowerCase().includes(s) ||
      t.code.toLowerCase().includes(s);
    if (!matchesSearch) return false;
    // Disease scope: disease-specific templates + generic (null disease_id)
    if (selectedDisease) {
      return !t.disease_id || t.disease_id === selectedDisease.id;
    }
    return true;
  });

  const diseaseNameForTemplate = (t: FormTemplate | null) => {
    if (!t) return undefined;
    const d = diseases.find((x) => x.id === t.disease_id) || selectedDisease;
    return d?.name?.fr || d?.code;
  };

  const card = (extra?: any) => ({
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid var(--border-color)',
    ...extra
  });

  if (!canAccessOfficialForms(user?.role)) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <AlertTriangle size={36} color="#F59E0B" style={{ marginBottom: 12 }} />
        <h2 style={{ color: 'var(--text-primary)', fontSize: 18, margin: '0 0 8px' }}>
          {lang === 'fr' ? 'Accès réservé aux agents' : 'Agents only'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          {lang === 'fr'
            ? 'Les fiches d\'investigation officielles sont réservées aux agents de santé, superviseurs et administrateurs.'
            : 'Official investigation forms are restricted to health agents, supervisors, and administrators.'}
        </p>
      </div>
    );
  }

  if (pdfPreviewData && selectedForm) {
    return (
      <OfficialFormPdfGenerator
        formTitle={selectedForm.title[lang as 'fr' | 'en'] || selectedForm.title.fr}
        formCode={selectedForm.code}
        version={selectedForm.version || 1}
        diseaseName={diseaseNameForTemplate(selectedForm)}
        data={pdfPreviewData}
        sections={selectedForm.schema_json?.sections || []}
        onClose={() => setPdfPreviewData(null)}
      />
    );
  }

  // ── SUBMITTED screen
  if (submitted) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(34,197,94,0.4)' }}>
          <CheckCircle size={40} color="#22C55E" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
          {lang === 'fr' ? 'Fiche Soumise avec Succès' : 'Form Successfully Submitted'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, maxWidth: '300px', margin: 0 }}>
          {submittedOffline
            ? (lang === 'fr'
              ? 'Hors-ligne : la fiche est enregistrée localement et sera synchronisée automatiquement dès le retour de la connexion.'
              : 'Offline: the form is saved locally and will sync automatically when connectivity returns.')
            : (lang === 'fr'
              ? 'La fiche d\'investigation officielle a été enregistrée dans la base de données nationale NIDSP.'
              : 'The official investigation form has been recorded in the NIDSP national database.')}
        </p>
        <button
          onClick={() => { setSubmitted(false); setSubmittedOffline(false); setSelectedForm(null); }}
          style={{ padding: '13px 36px', borderRadius: '10px', backgroundColor: 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
        >
          {lang === 'fr' ? 'Retour aux Fiches' : 'Back to Forms'}
        </button>
      </div>
    );
  }

  // ── FORM FILLER screen
  if (selectedForm) {
    return (
      <div style={{ padding: '16px', height: '100%' }}>
        <FormFiller
          template={selectedForm}
          lang={lang}
          user={user}
          diseaseId={selectedForm.disease_id || selectedDisease?.id}
          diseaseCode={
            diseases.find((d) => d.id === (selectedForm.disease_id || selectedDisease?.id))?.code ||
            selectedDisease?.code
          }
          onBack={() => setSelectedForm(null)}
          onSubmitted={(offline) => {
            setSubmittedOffline(offline);
            setSubmitted(true);
          }}
          onPreviewPdf={data => setPdfPreviewData(data)}
        />
      </div>
    );
  }

  // ── MAIN LIST screen
  return (
    <div style={{ padding: '16px', paddingBottom: '90px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px', marginTop: 0 }}>
        {lang === 'fr' ? 'Centre IDSR' : 'IDSR Center'}
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', marginTop: 0 }}>
        {lang === 'fr'
          ? 'Fiches officielles OMS • Définitions de cas • Protocoles RDC'
          : 'WHO Official Forms • Case Definitions • DRC Protocols'}
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '4px' }}>
        {[
          { key: 'forms', label: lang === 'fr' ? '📋 Fiches IDSR' : '📋 IDSR Forms', icon: ClipboardList },
          { key: 'definitions', label: lang === 'fr' ? '📖 Définitions' : '📖 Definitions', icon: BookOpen },
          { key: 'protocols', label: lang === 'fr' ? '🔬 Protocoles' : '🔬 Protocols', icon: FlaskConical }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '8px',
              fontSize: '11px', fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              backgroundColor: activeTab === tab.key ? 'var(--accent-mint)' : 'transparent',
              color: activeTab === tab.key ? 'var(--primary-foreground)' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── FORMS TAB ── */}
      {activeTab === 'forms' && (
        <>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher une fiche...' : 'Search forms...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 34px', borderRadius: '10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <Loader size={28} color="var(--accent-mint)" style={{ display: 'block', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              {lang === 'fr' ? 'Chargement des fiches officielles...' : 'Loading official forms...'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTemplates.map(template => {
                const title = template.title?.[lang as 'fr' | 'en'] || template.title?.fr || template.code;
                const sectionCount = template.schema_json?.sections?.length || 0;
                return (
                  <div key={template.id} style={card()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ fontSize: '10px', backgroundColor: 'var(--primary-alpha-20)', color: 'var(--accent-mint)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {template.code}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {template.version && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>v{template.version}</span>}
                        {sectionCount > 0 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-panel)', padding: '2px 6px', borderRadius: '4px' }}>
                            {sectionCount} {lang === 'fr' ? 'sections' : 'sections'}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '14px', marginTop: 0, lineHeight: 1.4 }}>
                      {title}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setSelectedForm(template)}
                        style={{
                          flex: 1, padding: '11px', borderRadius: '8px',
                          backgroundColor: 'var(--accent-mint)', color: 'var(--primary-foreground)', border: 'none',
                          fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <FileText size={14} />
                        {lang === 'fr' ? 'Remplir la fiche' : 'Fill form'}
                      </button>
                      {template.is_printable && (
                        <button
                          onClick={() => window.print()}
                          style={{ padding: '11px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                        >
                          <Printer size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredTemplates.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>{lang === 'fr' ? 'Aucune fiche trouvée' : 'No forms found'}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── DEFINITIONS TAB ── */}
      {activeTab === 'definitions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {CASE_DEFINITIONS.map(def => (
            <div key={def.code} style={{ ...card(), borderLeft: `4px solid ${def.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{def.name}</h3>
                <span style={{ fontSize: '10px', backgroundColor: `${def.color}1A`, color: def.color, padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  CFR {def.cfrRange}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: lang === 'fr' ? '⚠️ Cas Suspect' : '⚠️ Suspect Case', color: '#F59E0B', items: def.suspect },
                  { label: lang === 'fr' ? '🔴 Cas Probable' : '🔴 Probable Case', color: '#EF4444', items: def.probable },
                  { label: lang === 'fr' ? '✅ Cas Confirmé' : '✅ Confirmed Case', color: '#22C55E', items: def.confirmed }
                ].map(({ label, color, items }) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color, marginBottom: '4px' }}>{label}</div>
                    {items.map((c, i) => <p key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginLeft: '10px', margin: '0 0 2px 10px' }}>• {c}</p>)}
                  </div>
                ))}
                <div style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-mint)', marginBottom: '4px' }}>
                    🔬 {lang === 'fr' ? 'Prélèvement Requis' : 'Required Sampling'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{def.lab}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PROTOCOLS TAB ── */}
      {activeTab === 'protocols' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { title: 'Guide d\'investigation épidémiologique MVE', source: 'OMS AFRO / INRB', year: '2022' },
            { title: 'Protocole de prise en charge clinique Ebola', source: 'MSP RDC', year: '2023' },
            { title: 'Directives IDSR Afrique — 3e édition', source: 'WHO AFRO / Africa CDC', year: '2021' },
            { title: 'Protocole de traçabilité des contacts', source: 'CDC RDC / OMS', year: '2023' },
            { title: 'Guide de prélèvement et transport d\'échantillons', source: 'INRB Kinshasa', year: '2022' },
            { title: 'Procédures de lutte anti-vectorielle (RAC)', source: 'PNLP / MSP', year: '2023' }
          ].map(p => (
            <div key={p.title} style={{ ...card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px', marginTop: 0 }}>{p.title}</h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.source} • {p.year}</div>
              </div>
              <button style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'var(--accent-mint)', cursor: 'pointer', flexShrink: 0 }}>
                <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormsPage;
