import React, { useRef } from 'react';

interface OfficialPdfProps {
  formTitle: string;
  formCode: string;
  version: number;
  diseaseName?: string;
  data: Record<string, any>;
  sections: Array<{
    id: string;
    title: { fr: string; en: string };
    fields: Array<{ id: string; label: { fr: string; en: string }; type: string }>;
  }>;
  onClose: () => void;
}

export const OfficialFormPdfGenerator: React.FC<OfficialPdfProps> = ({
  formTitle,
  formCode,
  version,
  diseaseName,
  data,
  sections,
  onClose
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  /** Download a self-contained HTML archive suitable for offline print-to-PDF. */
  const handleDownloadHtml = () => {
    const markup = sheetRef.current?.outerHTML || '';
    const doc = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>${formCode}</title>
<style>
  body { font-family: Arial, sans-serif; color: #000; background: #fff; margin: 24px; }
  @media print { .no-print { display: none !important; } }
</style></head><body>${markup}</body></html>`;
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formCode}_v${version}_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolvedDisease =
    diseaseName ||
    data._disease_code ||
    data.disease_name ||
    'Surveillance multi-maladies';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#FFF', color: '#000', overflowY: 'auto', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '2px solid #000', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#E5E7EB', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          ← Retour à l'application
        </button>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Prévisualisation officielle ({formCode} v{version})
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleDownloadHtml} style={{ padding: '10px 16px', borderRadius: '6px', backgroundColor: '#111827', color: '#FFF', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            Télécharger HTML
          </button>
          <button onClick={handlePrint} style={{ padding: '10px 24px', borderRadius: '6px', backgroundColor: '#059669', color: '#FFF', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            Imprimer / Exporter PDF
          </button>
        </div>
      </div>

      <div ref={sheetRef} style={{ maxWidth: '800px', margin: '0 auto', border: '1px solid #CCC', padding: '32px', backgroundColor: '#FFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px double #000', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', lineHeight: 1.3 }}>
            <div>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</div>
            <div>MINISTÈRE DE LA SANTÉ PUBLIQUE, HYGIÈNE ET PRÉVOYANCE SOCIALE</div>
            <div style={{ fontSize: '9px', fontWeight: 'normal', marginTop: '4px' }}>CENTRE DES OPÉRATIONS D'URGENCE EN SANTÉ PUBLIQUE (COUSP)</div>
            <div style={{ fontSize: '9px', fontWeight: 'normal' }}>PLATEFORME ALERT EBOLA — SURVEILLANCE MULTI-MALADIES (NIDSP)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ border: '2px solid #000', padding: '6px 12px', fontWeight: 'bold', fontSize: '13px' }}>
              DOCUMENT OFFICIEL NIDSP
            </div>
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              Maladie: <b>{resolvedDisease}</b>
            </div>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>
              Réf: {data['patient_id_number'] || data['notification_reference'] || data['_form_code'] || formCode}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
            {formTitle}
          </h1>
          <div style={{ fontSize: '11px', fontStyle: 'italic', marginTop: '4px' }}>
            Système National Intégré de Surveillance des Maladies (NIDSP) • Version {version}
          </div>
        </div>

        {sections.map(section => (
          <div key={section.id} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #000', padding: '6px 10px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>
              {section.title.fr}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '11px' }}>
              {section.fields.map(field => {
                const rawVal = data[field.id];
                const displayVal =
                  rawVal === true || rawVal === 'true' ? '[X] Oui'
                    : rawVal === false || rawVal === 'false' ? '[ ] Non'
                      : (rawVal ?? '—');
                return (
                  <div key={field.id} style={{ borderBottom: '1px dotted #CCC', paddingBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: '#374151' }}>{field.label.fr} : </span>
                    <span style={{ color: '#000', fontWeight: '500' }}>{String(displayVal)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ border: '1px solid #000', padding: '12px', marginTop: '24px', pageBreakInside: 'avoid' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}>AUTHENTIFICATION DE L'INVESTIGATEUR</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '10px' }}>
            <div>Nom: <b>{data['investigator_name'] || data['_submitted_by_name'] || 'Agent NIDSP'}</b></div>
            <div>Rôle: <b>{data['investigator_role'] || 'Investigateur'}</b></div>
            <div>Zone: <b>{data['investigator_health_zone'] || data['health_zone'] || '—'}</b></div>
            <div>Tél: <b>{data['investigator_phone'] || '—'}</b></div>
            <div>Maladie: <b>{resolvedDisease}</b></div>
            <div>Date: <b>{new Date().toLocaleDateString('fr-FR')}</b></div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <div>Signature de l'agent: ___________________</div>
            <div>Sceau officiel du Centre: ___________________</div>
          </div>
        </div>

        <div style={{ marginTop: '32px', borderTop: '1px solid #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#6B7280' }}>
          <div>Alert EBOLA • NIDSP • Ministère de la Santé Publique RDC</div>
          <div>Form Code: {formCode}</div>
          <div>Archivage via Supabase Realtime</div>
        </div>
      </div>
    </div>
  );
};

export default OfficialFormPdfGenerator;
