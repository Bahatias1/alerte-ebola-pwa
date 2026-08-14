import React, { useState } from 'react';
import { HeartPulse, Globe, MapPin, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface OnboardingProps {
  onFinished: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onFinished }) => {
  const { lang, setLang } = useApp();
  const [step, setStep] = useState<number>(1);
  const [locConsent, setLocConsent] = useState<boolean>(true);
  const [notifConsent, setNotifConsent] = useState<boolean>(true);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save consents locally
      localStorage.setItem('onboarding_finished', 'true');
      localStorage.setItem('consent_location', String(locConsent));
      localStorage.setItem('consent_notifications', String(notifConsent));
      
      // Request standard browser notification permission
      if (notifConsent && 'Notification' in window) {
        Notification.requestPermission();
      }
      
      onFinished();
    }
  };

  return (
    <div style={styles.container} className="animate-fade">
      <div className="glass" style={styles.card}>
        {step === 1 && (
          <div style={styles.stepContent} className="animate-fade">
            <HeartPulse size={64} color="var(--accent-mint)" className="pulse-green" style={styles.icon} />
            <h1 style={styles.title}>Alert EBOLA</h1>
            <p style={styles.subtitle}>
              Plateforme nationale de surveillance multi-maladies et de signalement citoyen en République Démocratique du Congo.
            </p>
            
            <div style={styles.langSelector}>
              <div style={styles.langLabel}>
                <Globe size={18} />
                <span>Sélectionnez votre langue / Select language</span>
              </div>
              <div style={styles.langGrid}>
                {[
                  { code: 'fr', label: 'Français 🇫🇷' },
                  { code: 'en', label: 'English 🇬🇧' }
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setLang(item.code as any)}
                    style={{
                      ...styles.langBtn,
                      backgroundColor: lang === item.code ? 'var(--accent-mint)' : 'var(--bg-card)',
                      color: lang === item.code ? 'var(--primary-foreground)' : 'var(--text-primary)',
                      border: `1px solid ${lang === item.code ? 'var(--accent-mint)' : 'var(--border-color)'}`
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={styles.stepContent} className="animate-fade">
            <MapPin size={64} color="var(--primary)" style={styles.icon} />
            <h1 style={styles.title}>{lang === 'en' ? 'Geolocated Alerts' : 'Alertes Géolocalisées'}</h1>
            <p style={styles.subtitle}>
              {lang === 'en' 
                ? 'We use your coordinates to alert you in real-time if an Ebola outbreak or risk zone is detected nearby.' 
                : 'Nous utilisons vos coordonnées pour vous alerter en temps réel si un cas d\'Ebola ou une zone de risque est détectée à proximité.'}
            </p>
            
            <label style={styles.switchRow}>
              <span>{lang === 'en' ? 'Enable location services' : 'Activer la géolocalisation'}</span>
              <input
                type="checkbox"
                checked={locConsent}
                onChange={(e) => setLocConsent(e.target.checked)}
                style={styles.checkbox}
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div style={styles.stepContent} className="animate-fade">
            <Bell size={64} color="var(--warning)" style={styles.icon} />
            <h1 style={styles.title}>{lang === 'en' ? 'Immediate Notifications' : 'Notifications Immédiates'}</h1>
            <p style={styles.subtitle}>
              {lang === 'en'
                ? 'Stay updated instantly with reports validation, official health updates, and security recommendations.'
                : 'Restez informé instantanément de la validation de vos signalements, des bulletins sanitaires officiels et des consignes d\'urgence.'}
            </p>
            
            <label style={styles.switchRow}>
              <span>{lang === 'en' ? 'Enable push notifications' : 'Autoriser les notifications push'}</span>
              <input
                type="checkbox"
                checked={notifConsent}
                onChange={(e) => setNotifConsent(e.target.checked)}
                style={styles.checkbox}
              />
            </label>
          </div>
        )}

        <div style={styles.footer}>
          <div style={styles.dots}>
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                style={{
                  ...styles.dot,
                  backgroundColor: step === s ? 'var(--primary)' : 'var(--border-color)',
                  width: step === s ? '24px' : '8px'
                }}
              ></span>
            ))}
          </div>
          <button onClick={handleNext} className="btn-primary" style={styles.nextBtn}>
            {step === 3 ? (lang === 'en' ? 'Start' : 'Commencer') : (lang === 'en' ? 'Next' : 'Suivant')}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: 'var(--bg-dark)'
  },
  card: {
    maxWidth: '450px',
    width: '100%',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    boxShadow: 'var(--shadow-lg)'
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const
  },
  icon: {
    marginBottom: '20px',
    borderRadius: 'var(--radius-circle)',
    padding: '12px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    marginBottom: '12px',
    fontFamily: 'Outfit, sans-serif'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '24px'
  },
  langSelector: {
    width: '100%',
    textAlign: 'left' as const,
    gap: '12px',
    display: 'flex',
    flexDirection: 'column' as const
  },
  langLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  langGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    width: '100%'
  },
  langBtn: {
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid transparent',
    transition: 'all var(--transition-fast)'
  },
  switchRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--bg-panel)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    accentColor: 'var(--primary)',
    cursor: 'pointer'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px'
  },
  dots: {
    display: 'flex',
    gap: '6px'
  },
  dot: {
    height: '8px',
    borderRadius: '4px',
    transition: 'all var(--transition-fast)'
  },
  nextBtn: {
    padding: '10px 24px',
    fontSize: '14px'
  }
};
export default Onboarding;
