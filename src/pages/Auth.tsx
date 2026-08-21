import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import { HeartPulse, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import type { UserProfile } from '../types';

interface AuthProps {
  onNavigate: (route: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onNavigate }) => {
  const { setUser, lang, isOnline } = useApp();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(lang === 'en' ? 'Please fill in all fields' : 'Veuillez remplir tous les champs');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Production Login with Supabase (Strictly requires online connectivity)
      if (!isOnline) {
        throw new Error(
          lang === 'en'
            ? 'Offline login unavailable. An active internet connection is required to authenticate.'
            : 'Connexion impossible hors-ligne. Une connexion Internet active est requise pour vous authentifier.'
        );
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      if (authData?.user) {
        // Fetch authoritative profile data from the public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select()
          .eq('id', authData.user.id)
          .maybeSingle();

        if (userError) {
          console.warn('Could not fetch user profile from public.users:', userError);
        }

        const profile: UserProfile = {
          id: authData.user.id,
          name: userData?.name || 'Utilisateur',
          postnom: userData?.post_nom || '',
          email: authData.user.email || email,
          role: userData?.role || 'CITIZEN',
          selectedLanguage: userData?.selectedLanguage || 'fr',
          locationConsent: true,
          notificationsConsent: true,
          currentRegion: userData?.location || 'Localisation...',
          isPremium: userData?.role === 'SUPER_ADMIN',
          joinedTimestamp: Date.now(),
          lastSyncTimestamp: Date.now()
        };
        
        await setUser(profile);
        onNavigate('home');
      }
    } catch (e: unknown) {
      console.error('Authentication failure:', e);
      const msg = e instanceof Error ? e.message : (lang === 'en' ? 'Invalid email or password' : 'Email ou mot de passe incorrect');
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade">
      <div className="glass" style={styles.card}>
        <div style={styles.header}>
          <HeartPulse size={48} color="var(--emergency)" className="pulse-red" />
          <h1 style={styles.title}>Connexion</h1>
          <p style={styles.subtitle}>Alert Ebola RDC</p>
        </div>

        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Adresse Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                placeholder="Ex: docteur@sante.cd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
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

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={styles.submitBtn}
          >
            {isLoading ? 'Connexion en cours...' : 'Se Connecter'}
          </button>
        </form>

        <div style={styles.registerLink}>
          <span>Nouveau sur Alert Ebola ?</span>
          <button onClick={() => onNavigate('register')} style={styles.textBtn}>
            Créer un compte
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
    maxWidth: '420px',
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
    gap: '20px'
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
    padding: '12px 12px 12px 40px',
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
export default Auth;
