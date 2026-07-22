import React from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';
import {
  Activity, ShieldAlert, TestTube, Users, Settings,
  TrendingUp, AlertTriangle, FileText, PlusCircle
} from 'lucide-react';

interface RoleDashboardProps {
  onNavigate: (route: string) => void;
}

export const RoleBasedDashboard: React.FC<RoleDashboardProps> = ({ onNavigate }) => {
  const { user, epidemicStats, alerts, myReports, selectedDisease } = useApp();
  const role: UserRole = user?.role || 'PUBLIC_USER';

  // Role Badge Styling
  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'SUPER_ADMIN': return { label: 'SUPER ADMIN', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' };
      case 'ADMIN': case 'ADMIN_SANTE': return { label: 'ADMINISTRATEUR', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.15)' };
      case 'SUPERVISOR': return { label: 'SUPERVISEUR RÉGIONAL', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'LABORATORY': return { label: 'LABORATOIRE / INRB', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
      case 'HEALTH_AGENT': return { label: 'AGENT DE SANTÉ', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      default: return { label: 'CITOYEN', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Portal Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0B4F48 0%, #063A35 100%)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(20, 184, 166, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: badge.color, backgroundColor: badge.bg, padding: '3px 10px', borderRadius: '12px', border: `1px solid ${badge.color}40` }}>
                {badge.label}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {selectedDisease ? selectedDisease.name.fr : 'Alert Disease Portal'}
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#FFF' }}>
              {user ? `Bonjour, ${user.name}` : 'Portail National Sanitaire — Alert Disease'}
            </h1>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
          Espace opérationnel d'épidémiosurveillance et de riposte sanitaire OMS / Ministère de la Santé RDC.
        </p>

        {/* Dynamic Role Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {(role === 'PUBLIC_USER' || role === 'USER') && (
            <button
              onClick={() => onNavigate('report')}
              style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: 'var(--accent-mint)', color: '#000', border: 'none', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <PlusCircle size={16} /> Signaler un cas
            </button>
          )}

          {(role === 'HEALTH_AGENT' || role === 'ADMIN' || role === 'SUPERVISOR') && (
            <button
              onClick={() => onNavigate('agent_portal')}
              style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: 'var(--accent-mint)', color: '#000', border: 'none', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Activity size={16} /> Espace Enquêtes Terrain
            </button>
          )}

          {(role === 'LABORATORY' || role === 'ADMIN') && (
            <button
              onClick={() => onNavigate('lab_portal')}
              style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: '#8B5CF6', color: '#FFF', border: 'none', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <TestTube size={16} /> Espace Laboratoire INRB
            </button>
          )}

          {(role === 'SUPERVISOR' || role === 'ADMIN') && (
            <button
              onClick={() => onNavigate('supervisor_portal')}
              style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: '#3B82F6', color: '#FFF', border: 'none', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Users size={16} /> Dashboard Régional
            </button>
          )}

          {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'ADMIN_SANTE') && (
            <button
              onClick={() => onNavigate('admin_portal')}
              style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: '#FFF', border: '1px solid var(--accent-mint)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Settings size={16} /> Administration Système
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cas Cumulés</span>
            <TrendingUp size={16} color="var(--accent-mint)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFF' }}>{epidemicStats?.totalCases ?? '142'}</div>
          <span style={{ fontSize: '10px', color: 'var(--accent-mint)' }}>RDC Global</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Alertes Actives</span>
            <AlertTriangle size={16} color="var(--emergency)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--emergency)' }}>{alerts.filter(a => a.status === 'active').length}</div>
          <span style={{ fontSize: '10px', color: 'var(--emergency)' }}>Investigation requise</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Signalements Citoyens</span>
            <FileText size={16} color="var(--accent-mint)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFF' }}>{myReports.length}</div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Dans la base</span>
        </div>
      </div>

      {/* 3. Role-Specific Dedicated Widgets */}
      {role === 'PUBLIC_USER' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFF', marginBottom: '12px' }}>💡 Mon Espace Citoyen</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Accédez à vos signalements sanitaires, aux fiches d'information OMS et aux numéros d'urgence de la RDC.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={() => onNavigate('my_reports')} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--accent-mint)" /> Mes Signalements
            </button>
            <button onClick={() => onNavigate('forms')} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="var(--accent-mint)" /> Fiches IDSR
            </button>
          </div>
        </div>
      )}

      {(role === 'HEALTH_AGENT' || role === 'ADMIN' || role === 'SUPERVISOR') && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', padding: '16px', border: '1px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} /> Module Agent de Santé / Enquêteur Terrain
            </h2>
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              FIELD SUITE
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Gestion des enquêtes épidémiologiques attribuées, suivi des contacts et demandes de prélèvements.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <button onClick={() => onNavigate('agent_portal')} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              📋 Enquêtes Attribuées (3)
            </button>
            <button onClick={() => onNavigate('agent_portal')} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              👥 Suivi des Contacts (18)
            </button>
          </div>
        </div>
      )}

      {(role === 'LABORATORY' || role === 'ADMIN') && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', padding: '16px', border: '1px solid #8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TestTube size={18} /> Module Laboratoire INRB & Validation
            </h2>
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              LAB SUITE
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Réception des échantillons sanguins/écouvillons, saisie des résultats PCR/Culture et validation.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <button onClick={() => onNavigate('lab_portal')} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              🧪 Échantillons en Attente (5)
            </button>
            <button onClick={() => onNavigate('lab_portal')} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              ✅ Saisie Résultats PCR
            </button>
          </div>
        </div>
      )}

      {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'ADMIN_SANTE') && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--accent-mint)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-mint)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} /> Console Administration NIDSP
            </h2>
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(20, 184, 166, 0.2)', color: 'var(--accent-mint)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              ENTERPRISE ADMIN
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Gestion des utilisateurs RBAC, catalogue des pathogènes, moteur de règles et journaux d'audit Supabase.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <button onClick={() => onNavigate('admin_portal')} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              👥 Gestion Utilisateurs RBAC
            </button>
            <button onClick={() => onNavigate('admin_portal')} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              🛡️ Catalogue des Pathogènes
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default RoleBasedDashboard;
