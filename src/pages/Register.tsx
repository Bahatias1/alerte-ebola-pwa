import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import { HeartPulse, Mail, Lock, User, Eye, EyeOff, Star } from 'lucide-react';
import type { UserProfile } from '../types';

interface RegisterProps {
  onNavigate: (route: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { setUser, lang, isOnline } = useApp();
  const [nom, setNom] = useState<string>('');
  const [postnom, setPostnom] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !email || !password) {
      setErrorMsg(lang === 'en' ? 'Please fill in all required fields' : 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!isOnline) {
      setErrorMsg(lang === 'en' ? 'Cannot register while offline' : 'L\'inscription nécessite une connexion internet');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Sign up user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;

      const userUid = authData?.user?.id;
      if (userUid) {
        const defaultRole = 'USER';
        
        // 2. Insert user profile into public.users table
        const { error: dbError } = await supabase.from('users').upsert({
          id: userUid,
          name: nom,
          post_nom: postnom,
          email,
          role: defaultRole,
          province: 'Kinshasa', // default starting province
          selectedLanguage: lang
        });

        if (dbError) {
          console.error('Error inserting profile in public.users:', dbError);
        }

        // Call the auth-mail Edge Function in background (non-blocking)
        try {
          supabase.functions.invoke('auth-mail', {
            body: { email, username: nom, language: lang }
          });
        } catch (mailErr) {
          console.error('Failed to trigger welcome email Edge Function:', mailErr);
        }

        const profile: UserProfile = {
          id: userUid,
          name: nom,
          postnom,
          email,
          role: defaultRole,
          selectedLanguage: lang,
          locationConsent: true,
          notificationsConsent: true,
          currentRegion: 'Kinshasa',
          isPremium,
          joinedTimestamp: Date.now(),
          lastSyncTimestamp: Date.now()
        };

        await setUser(profile);
        onNavigate('home');
      } else {
        throw new Error(lang === 'en' ? 'Registration failed: UID is null' : 'L\'inscription a échoué: l\'identifiant utilisateur est nul');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || (lang === 'en' ? 'Registration failed' : 'Échec de l\'inscription'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade">
      <div className="glass" style={styles.card}>
        <div style={styles.header}>
          <HeartPulse size={48} color="var(--emergency)" className="pulse-red" />
          <h1 style={styles.title}>Inscription</h1>
          <p style={styles.subtitle}>Créer un profil EbolAlert</p>
        </div>

        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nom *</label>
              <div style={styles.inputWrapper}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="Kabasele"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Postnom</label>
              <div style={styles.inputWrapper}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="Jean"
                  value={postnom}
                  onChange={(e) => setPostnom(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Adresse Email *</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                placeholder="docteur@sante.cd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe *</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label style={styles.switchRow}>
            <div style={styles.switchText}>
              <div style={styles.switchTitle}>
                <Star size={14} color="var(--warning)" fill="currentColor" />
                <span>Mode Famille (Premium)</span>
              </div>
              <span style={styles.switchDesc}>Sous-surveillance médicale pour 5 proches.</span>
            </div>
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              style={styles.checkbox}
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={styles.submitBtn}
          >
            {isLoading ? 'Création de compte...' : 'S\'inscrire'}
          </button>
        </form>

        <div style={styles.registerLink}>
          <span>Déjà inscrit ?</span>
          <button onClick={() => onNavigate('auth')} style={styles.textBtn}>
            Se connecter
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
    maxWidth: '460px',
    width: '100%',
    padding: '32px',
    boxShadow: 'var(--shadow-lg)'
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    marginBottom: '28px'
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    fontFamily: 'Outfit, sans-serif'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid var(--emergency)',
    color: 'var(--emergency)',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    marginBottom: '20px',
    textAlign: 'center' as const
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px'
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative' as const
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '12px',
    color: 'var(--text-muted)'
  },
  input: {
    width: '100%',
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '12px 12px 12px 36px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color var(--transition-fast)'
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: '12px',
    background: 'transparent',
    color: 'var(--text-muted)'
  },
  switchRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-panel)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer'
  },
  switchText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px'
  },
  switchTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600
  },
  switchDesc: {
    fontSize: '10px',
    color: 'var(--text-muted)'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: 'var(--primary)',
    cursor: 'pointer'
  },
  submitBtn: {
    marginTop: '10px',
    fontSize: '15px',
    fontWeight: 600
  },
  registerLink: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '24px'
  },
  textBtn: {
    background: 'transparent',
    color: 'var(--primary)',
    fontWeight: 600,
    fontSize: '13px'
  }
};
export default Register;
