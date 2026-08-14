import React, { useState } from 'react';
import { BookOpen, Video, HelpCircle, FileDown, ChevronDown, ChevronUp, ExternalLink, Search } from 'lucide-react';

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  disease?: string;
  url?: string;
  type: 'guideline' | 'faq' | 'video' | 'document';
}

const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: '1', type: 'guideline', category: 'Prévention', disease: 'Ebola',
    title: 'Comment se protéger de la MVE (Maladie à Virus Ebola) ?',
    summary: 'Évitez tout contact avec le sang, les fluides corporels, la viande de brousse et les animaux malades. Lavez-vous les mains régulièrement avec de l\'eau et du savon. En cas de contact avec un cas suspect, informez immédiatement le centre de santé le plus proche.'
  },
  {
    id: '2', type: 'faq', category: 'Symptômes', disease: 'Ebola',
    title: 'Quels sont les symptômes de la maladie à virus Ebola ?',
    summary: 'Les symptômes apparaissent 2 à 21 jours après l\'exposition : fièvre soudaine ≥ 38°C, fatigue intense, douleurs musculaires, maux de tête, gorge irritée, vomissements, diarrhées, éruptions cutanées et, dans certains cas, hémorragies internes et externes.'
  },
  {
    id: '3', type: 'guideline', category: 'Prévention', disease: 'Choléra',
    title: 'Prévention du Choléra : eau, hygiène et assainissement',
    summary: 'Buvez uniquement de l\'eau bouillie ou traitée au chlore. Lavez-vous les mains avec du savon avant de manger et après les toilettes. Évitez la nourriture vendue dans la rue non cuite. Le vaccin oral contre le choléra est disponible dans les zones à risque.'
  },
  {
    id: '4', type: 'faq', category: 'Traitement', disease: 'Ebola',
    title: 'Existe-t-il un traitement contre Ebola ?',
    summary: 'Oui, il existe des traitements comme l\'Atoltivimab/Maftivimab/Odesivimab (mAb114) et le Remdesivir qui ont montré leur efficacité. Un vaccin préventif rVSV-ZEBOV (Ervebo) est disponible et recommandé pour les contacts et les professionnels de santé.'
  },
  {
    id: '5', type: 'guideline', category: 'Soignants', disease: 'Toutes maladies',
    title: 'Équipements de Protection Individuelle (EPI) pour soignants',
    summary: 'Lors de la prise en charge de cas suspects : blouse imperméable, gants doubles, masque FFP2 ou N95, lunettes de protection, surblouses, sur-chaussures. Formez-vous aux procédures de d\'enfilage et de déshabillement (donning/doffing) avant toute intervention.'
  },
  {
    id: '6', type: 'faq', category: 'Signalement', disease: 'Toutes maladies',
    title: 'Quand et comment signaler un cas suspect ?',
    summary: 'Signalez immédiatement tout cas présentant les critères de la définition de cas via : (1) ce portail numérique, (2) l\'application mobile NIDSP, (3) le numéro d\'urgence épidémiologique 0800 00 000, ou (4) en informant le chef de zone de santé.'
  },
  {
    id: '7', type: 'faq', category: 'Traçage', disease: 'Ebola',
    title: 'Qu\'est-ce que le traçage des contacts ?',
    summary: 'Le traçage des contacts consiste à identifier toutes les personnes ayant eu un contact avec un cas confirmé, de les suivre pendant 21 jours et d\'assurer un accès rapide aux soins en cas d\'apparition de symptômes. C\'est une mesure clé pour briser la chaîne de transmission.'
  },
  {
    id: '8', type: 'guideline', category: 'Vaccin', disease: 'Ebola',
    title: 'Vaccination Ebola : qui peut se faire vacciner ?',
    summary: 'La vaccination en anneau est recommandée pour : les contacts et contacts des contacts des cas confirmés, les travailleurs de santé en première ligne, les équipes de réponse d\'urgence. Le vaccin Ervebo (rVSV-ZEBOV) est administré en dose unique.'
  }
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'guideline': <BookOpen size={14} />,
  'faq': <HelpCircle size={14} />,
  'video': <Video size={14} />,
  'document': <FileDown size={14} />
};

export const KnowledgePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const diseases = ['all', 'Ebola', 'Mpox', 'Choléra', 'Toutes maladies'];

  const filtered = KNOWLEDGE_ITEMS.filter(item => {
    const matchSearch = search === '' || item.title.toLowerCase().includes(search.toLowerCase()) || item.summary.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || item.disease === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>Centre de Connaissances</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Guides OMS • FAQs • Protocoles • Formation sanitaire
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Rechercher dans la base de connaissances..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 10px 10px 34px', borderRadius: '10px',
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box' as const
          }}
        />
      </div>

      {/* Disease filter chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
        {diseases.map(d => (
          <button
            key={d}
            onClick={() => setActiveFilter(d)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: activeFilter === d ? 'bold' : 'normal',
              border: `1px solid ${activeFilter === d ? 'var(--accent-mint)' : 'var(--border-color)'}`,
              backgroundColor: activeFilter === d ? 'var(--primary-alpha-20)' : 'var(--bg-card)',
              color: activeFilter === d ? 'var(--accent-mint)' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const
            }}
          >
            {d === 'all' ? 'Toutes' : d}
          </button>
        ))}
      </div>

      {/* WHO featured banner */}
      <div style={{
        background: 'var(--hero-gradient)',
        borderRadius: '14px',
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        gap: '14px',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '36px' }}>🌍</div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#60A5FA', marginBottom: '4px' }}>OMS AFRO • RECOMMANDÉ</div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Stratégie Mondiale de Lutte contre les Épidémies 2024–2026
          </h3>
          <a href="https://www.afro.who.int/" target="_blank" rel="noreferrer" style={{ color: '#60A5FA', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Consulter <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Knowledge items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(item => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: `1px solid ${expandedId === item.id ? 'var(--accent-mint)' : 'var(--border-color)'}`,
              overflow: 'hidden',
              transition: 'border-color 0.2s'
            }}
          >
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                textAlign: 'left' as const
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: 'var(--primary-alpha-20)',
                    color: 'var(--accent-mint)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {CATEGORY_ICONS[item.type]}
                    {item.category}
                  </span>
                  {item.disease && item.disease !== 'Toutes maladies' && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.disease}</span>
                  )}
                </div>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1.4' }}>{item.title}</h3>
              </div>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }}>
                {expandedId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {expandedId === item.id && (
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{item.summary}</p>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '12px',
                      fontSize: '12px',
                      color: 'var(--accent-mint)',
                      fontWeight: 'bold'
                    }}>
                      <ExternalLink size={12} /> En savoir plus
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <HelpCircle size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.5 }} />
            Aucun résultat trouvé
          </div>
        )}
      </div>
    </div>
  );
};
export default KnowledgePage;
