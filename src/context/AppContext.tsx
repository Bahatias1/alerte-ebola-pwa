import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { db } from '../db';
import type { UserProfile, EbolaAlert, OfficialSource, HealthCenter, EpidemicStats, ReportedCase, Disease } from '../types';

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  lang: 'fr' | 'en';
  setLang: (lang: 'fr' | 'en') => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  alerts: EbolaAlert[];
  officialSources: OfficialSource[];
  healthCenters: HealthCenter[];
  epidemicStats: EpidemicStats | null;
  diseases: Disease[];
  selectedDisease: Disease | null;
  setSelectedDisease: (disease: Disease) => void;
  myReports: ReportedCase[];
  setMyReports: (reports: ReportedCase[]) => void;
  refreshData: () => Promise<void>;
  markAlertAsRead: (id: string) => Promise<void>;
  hasUnreadAlerts: boolean;
  syncOfflineReports: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_DISEASES: Disease[] = [
  { id: '9b6a006f-288c-4223-9b27-b77797cc8d97', code: 'EBOV', name: { fr: 'Maladie à Virus Ebola', en: 'Ebola Virus Disease' }, family: 'Filoviridae', caseFatalityRate: '50-90%', isActive: true },
  { id: 'ee0985a2-e910-44f7-ba2a-7825083b6172', code: 'MARV', name: { fr: 'Maladie à Virus Marburg', en: 'Marburg Virus Disease' }, family: 'Filoviridae', caseFatalityRate: '88%', isActive: true },
  { id: 'afb0fbf6-e7c5-4c45-9fa2-0cd0965eb74c', code: 'MPOX', name: { fr: 'Variole du Singe (Mpox)', en: 'Mpox (Monkeypox)' }, family: 'Poxviridae', caseFatalityRate: '1-10%', isActive: true },
  { id: '0d32ba0c-2c74-40e2-8afd-8f6d1cc9c81b', code: 'CHOLERA', name: { fr: 'Choléra', en: 'Cholera' }, family: 'Vibrionaceae', caseFatalityRate: '1-5%', isActive: true },
  { id: '429108b8-da5c-41f3-ab01-4029ffe2f641', code: 'MEASLES', name: { fr: 'Rougeole', en: 'Measles' }, family: 'Paramyxoviridae', isActive: true }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [lang, setLangState] = useState<'fr' | 'en'>('fr');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<EbolaAlert[]>([]);
  const [officialSources, setOfficialSources] = useState<OfficialSource[]>([]);
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [epidemicStats, setEpidemicStats] = useState<EpidemicStats | null>(null);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState<boolean>(false);
  const [diseases, setDiseases] = useState<Disease[]>(DEFAULT_DISEASES);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(DEFAULT_DISEASES[0]);
  const [myReports, setMyReports] = useState<ReportedCase[]>([]);

  // Load authoritative disease catalog from Supabase (fallback: DEFAULT_DISEASES)
  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('disease_catalog')
          .select('id, code, name, category, is_active, risk_color_hex')
          .eq('is_active', true)
          .order('code');
        if (cancelled || error || !data?.length) return;
        const mapped: Disease[] = data.map((d: any) => ({
          id: d.id,
          code: d.code,
          name: d.name || { fr: d.code, en: d.code },
          family: d.category,
          isActive: d.is_active !== false,
        }));
        setDiseases(mapped);
        setSelectedDisease((prev) => {
          if (prev) {
            const match = mapped.find((d) => d.code === prev.code || d.id === prev.id);
            if (match) return match;
          }
          return mapped.find((d) => d.code === 'EBOV') || mapped[0];
        });
      } catch (e) {
        console.error('Failed to load disease_catalog:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [isOnline]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineReports();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  // Custom setter for User — also updates IndexedDB cache
  const setUser = async (newUser: UserProfile | null) => {
    if (newUser) {
      const safeUser: UserProfile = {
        ...newUser,
        selectedLanguage: (newUser.selectedLanguage === 'en' ? 'en' : 'fr')
      };
      setUserState(safeUser);
      setLangState(safeUser.selectedLanguage);
      await db.userProfiles.put(safeUser);
    } else {
      setUserState(null);
      await db.userProfiles.clear();
    }
  };

  // Change Language
  const setLang = async (newLang: 'fr' | 'en') => {
    setLangState(newLang);
    if (user) {
      const updated: UserProfile = { ...user, selectedLanguage: newLang };
      setUserState(updated);
      await db.userProfiles.put(updated);
      if (isOnline) {
        try {
          await supabase.from('users').update({ selectedLanguage: newLang }).eq('id', user.id);
        } catch (e) {
          console.error('Failed to sync language to Supabase:', e);
        }
      }
    }
  };

  // Sync Offline Reports
  const syncOfflineReports = async () => {
    if (!navigator.onLine || !user) return;
    try {
      const unsynced = await db.reportedCases.where('status').equals('Suspect').toArray();
      const offlineUnsynced = unsynced.filter(r => !r.id || r.id.startsWith('offline_'));
      if (offlineUnsynced.length === 0) return;
      for (const report of offlineUnsynced) {
        let geomString: string | undefined = undefined;
        if (report.latitude && report.longitude) {
          geomString = `POINT(${report.longitude} ${report.latitude})`;
        }
        const { id, ...supabaseData } = report;
        const insertData = { ...supabaseData, user_id: user.id, geom: geomString };
        const { data, error } = await supabase.from('reported_cases').insert(insertData).select();
        if (!error && data && data.length > 0) {
          if (id) await db.reportedCases.delete(id);
          const syncedReport: ReportedCase = {
            id: data[0].id,
            fullName: data[0].full_name || report.fullName,
            phone: data[0].phone || report.phone,
            location: data[0].region || report.location,
            symptoms: data[0].symptoms || report.symptoms,
            description: data[0].description || report.description,
            status: data[0].status || 'Suspect',
            createdAt: data[0].created_at
          };
          await db.reportedCases.put(syncedReport);
        }
      }
    } catch (e) {
      console.error('Error during offline reports sync:', e);
    }
  };

  // Mark alert as read
  const markAlertAsRead = async (id: string) => {
    try {
      const updatedReadAt = new Date().toISOString();
      await db.alerts.update(id, { isRead: true });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
      if (user && isOnline) {
        await supabase.from('user_notifications').upsert({
          user_id: user.id,
          notification_id: id,
          is_read: true,
          read_at: updatedReadAt
        }, { onConflict: 'user_id,notification_id' });
      }
    } catch (e) {
      console.error('Failed to mark alert as read:', e);
    }
  };

  // Load from IndexedDB
  const loadLocalCache = async () => {
    const cachedUser = await db.userProfiles.toCollection().first();
    if (cachedUser) {
      setUserState(cachedUser);
      const safeLang = (cachedUser.selectedLanguage === 'en' ? 'en' : 'fr');
      setLangState(safeLang);
    }
    const cachedAlerts = await db.alerts.reverse().sortBy('timestamp');
    setAlerts(cachedAlerts);
    setHasUnreadAlerts(cachedAlerts.some(a => !a.isRead));
    const cachedSources = await db.officialSources.reverse().sortBy('fetchedAt');
    setOfficialSources(cachedSources);
    const cachedCenters = await db.healthCenters.orderBy('name').toArray();
    setHealthCenters(cachedCenters);
    const cachedStats = await db.epidemicStats.toCollection().first();
    if (cachedStats) setEpidemicStats(cachedStats);
  };

  // Pull fresh data from Supabase
  const refreshData = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      // 1. Alerts
      const { data: alertsData, error: alertsErr } = await supabase
        .from('alerts')
        .select()
        .order('created_at', { ascending: false });
      if (!alertsErr && alertsData) {
        const localAlerts = await db.alerts.toArray();
        const mappedAlerts: EbolaAlert[] = alertsData.map(a => {
          const local = localAlerts.find(l => l.id === String(a.id));
          return {
            id: String(a.id),
            title: a.title,
            description: a.description,
            severity: a.severity || 'Moyen',
            region: a.region,
            latitude: a.latitude,
            longitude: a.longitude,
            status: a.status || 'active',
            timestamp: new Date(a.created_at).getTime(),
            isRead: local ? local.isRead : false,
            isOfficiallyVerified: true,
            isSystemGenerated: false
          };
        });
        await db.alerts.clear();
        await db.alerts.bulkPut(mappedAlerts);
        setAlerts(mappedAlerts);
        setHasUnreadAlerts(mappedAlerts.some(a => !a.isRead));
      }

      // 2. Official Sources
      const { data: sourcesData, error: sourcesErr } = await supabase
        .from('official_sources')
        .select()
        .order('published_at', { ascending: false });
      if (!sourcesErr && sourcesData) {
        const mappedSources: OfficialSource[] = sourcesData.map(s => ({
          id: s.id,
          title: s.title,
          content: s.content,
          sourceType: s.source_type,
          fetchedAt: s.fetched_at,
          publishedAt: s.published_at,
          aiSummary: s.ai_summary
        }));
        await db.officialSources.clear();
        await db.officialSources.bulkPut(mappedSources);
        setOfficialSources(mappedSources);
      }

      // 3. Health Centers
      const { data: centersData, error: centersErr } = await supabase.from('health_centers').select();
      if (!centersErr && centersData) {
        const mappedCenters: HealthCenter[] = centersData.map(c => ({
          id: c.id,
          name: c.name,
          province: c.province,
          bedsAvailable: c.available_beds || 0,
          totalBeds: c.total_beds || 0,
          phone: c.phone || '',
          doctorInCharge: c.emergency_contact || 'Personnel Médical',
          latitude: c.latitude || 0,
          longitude: c.longitude || 0,
          verified: c.verified || false,
          address: c.address || '',
          operatingHours: c.operating_hours || '24h/24'
        }));
        await db.healthCenters.clear();
        await db.healthCenters.bulkPut(mappedCenters);
        setHealthCenters(mappedCenters);
      }

      // 4. Epidemic Stats (Real DB aggregation)
      const [{ data: epiCasesData }, { data: repCasesData }, { data: offStatsData }] = await Promise.all([
        supabase.from('epidemiological_cases').select('id, current_status, created_at'),
        supabase.from('reported_cases').select('id, status, created_at'),
        supabase.from('official_statistics').select('*').order('report_date', { ascending: false }).limit(1)
      ]);

      const epiList = epiCasesData || [];
      const repList = repCasesData || [];
      const latestOffStat = offStatsData?.[0];

      const confirmedReports = repList.filter(r => (r.status || '').toLowerCase().includes('valid')).length;
      const epiConfirmed = epiList.length;
      const totalCases = latestOffStat?.confirmed_cases ?? (confirmedReports + epiConfirmed);
      const totalDeaths = latestOffStat?.total_deaths ?? epiList.filter(c => c.current_status === 'DECEASED').length;
      const recovered = latestOffStat?.recovered ?? epiList.filter(c => c.current_status === 'RECOVERED').length;

      // Weekly trend: cases in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentCasesCount = repList.filter(r => r.created_at >= sevenDaysAgo).length +
        epiList.filter(c => c.created_at >= sevenDaysAgo).length;

      const globalStats: EpidemicStats = {
        totalCases,
        recovered,
        deaths: totalDeaths,
        weeklyTrend: recentCasesCount,
        lastUpdated: new Date().toISOString()
      };
      await db.epidemicStats.put({ ...globalStats, id: 1 });
      setEpidemicStats(globalStats);

      // 5. My Reports (for authenticated user)
      if (user) {
        const { data: reportsData } = await supabase
          .from('reported_cases')
          .select()
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (reportsData) {
          const mapped: ReportedCase[] = reportsData.map(r => ({
            id: r.id,
            diseaseId: r.disease_id || r.suspected_disease_id || undefined,
            fullName: r.full_name || '',
            phone: r.phone || '',
            location: r.health_zone_name || r.province_name || '',
            symptoms: r.symptoms || '',
            description: r.description || '',
            status: r.status || 'Suspect',
            createdAt: r.created_at
          }));
          setMyReports(mapped);
        }
      }

      await syncOfflineReports();
    } catch (e) {
      console.error('Sync failed, relying on offline database:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Setup initial data load & realtime subscription
  useEffect(() => {
    loadLocalCache().then(() => {
      if (isOnline) refreshData();
    });

    const alertsChannel = supabase.channel('public:alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, async (payload) => {
        const fresh = payload.new;
        const newAlert: EbolaAlert = {
          id: String(fresh.id),
          title: fresh.title,
          description: fresh.description,
          severity: fresh.severity || 'Moyen',
          region: fresh.region,
          latitude: fresh.latitude,
          longitude: fresh.longitude,
          status: fresh.status || 'active',
          timestamp: new Date(fresh.created_at).getTime(),
          isRead: false,
          isOfficiallyVerified: true,
          isSystemGenerated: false
        };
        await db.alerts.put(newAlert);
        setAlerts(prev => [newAlert, ...prev]);
        setHasUnreadAlerts(true);
        if (Notification.permission === 'granted') {
          new Notification(`⚠️ ALERTE SANITAIRE : ${newAlert.title}`, {
            body: newAlert.description,
            icon: '/icons/icon-192x192.png'
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
    };
  }, [isOnline]);

  const logout = async () => {
    await supabase.auth.signOut();
    await setUser(null);
    setMyReports([]);
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      lang,
      setLang,
      theme,
      toggleTheme,
      isOnline,
      isSyncing,
      alerts,
      officialSources,
      healthCenters,
      epidemicStats,
      diseases,
      selectedDisease,
      setSelectedDisease,
      myReports,
      setMyReports,
      refreshData,
      markAlertAsRead,
      hasUnreadAlerts,
      syncOfflineReports,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
