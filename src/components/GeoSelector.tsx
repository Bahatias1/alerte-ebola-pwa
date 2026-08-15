/**
 * GeoSelector — Cascading geographic selector backed by real Supabase PostGIS tables.
 * Hierarchy: Province → Zone de Santé → Aire de Santé → Village/Quartier (free text)
 *
 * Uses the same tables as admin/src/services/geographyService.ts:
 *   provinces, health_zones (province_id FK), health_areas (health_zone_id FK)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export interface GeoSelection {
  provinceId: string;
  provinceName: string;
  healthZoneId: string;
  healthZoneName: string;
  healthAreaId: string;
  healthAreaName: string;
  village: string;
}

interface GeoSelectorProps {
  value: Partial<GeoSelection>;
  onChange: (sel: Partial<GeoSelection>) => void;
  disabled?: boolean;
  required?: boolean;
  /** If true, adds a "Village / Quartier" free-text input at the end */
  showVillage?: boolean;
}

interface Row { id: string; name: string; }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: '10px',
  backgroundColor: 'var(--bg-panel)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  boxSizing: 'border-box',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: '6px',
  fontWeight: '500',
};

const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' };

export const GeoSelector: React.FC<GeoSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  showVillage = true,
}) => {
  const [provinces, setProvinces] = useState<Row[]>([]);
  const [zones, setZones] = useState<Row[]>([]);
  const [areas, setAreas] = useState<Row[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Load provinces once on mount (public table, no RLS auth needed)
  useEffect(() => {
    supabase
      .from('provinces')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setProvinces(data.map((r: any) => ({ id: r.id, name: r.name })));
      });
  }, []);

  // Load health zones when province changes
  const loadZones = useCallback(async (provinceId: string) => {
    if (!provinceId) {
      setZones([]);
      setAreas([]);
      return;
    }
    setLoadingZones(true);
    setZones([]);
    setAreas([]);
    const { data } = await supabase
      .from('health_zones')
      .select('id, name')
      .eq('province_id', provinceId)
      .order('name');
    setZones((data || []).map((r: any) => ({ id: r.id, name: r.name })));
    setLoadingZones(false);
  }, []);

  // Load health areas when zone changes
  const loadAreas = useCallback(async (healthZoneId: string) => {
    if (!healthZoneId) {
      setAreas([]);
      return;
    }
    setLoadingAreas(true);
    setAreas([]);
    const { data } = await supabase
      .from('health_areas')
      .select('id, name')
      .eq('health_zone_id', healthZoneId)
      .order('name');
    setAreas((data || []).map((r: any) => ({ id: r.id, name: r.name })));
    setLoadingAreas(false);
  }, []);

  const prevProvIdRef = useRef<string | undefined>(undefined);
  const prevZoneIdRef = useRef<string | undefined>(undefined);

  // React to prop changes only when IDs actually change
  useEffect(() => {
    if (value.provinceId && value.provinceId !== prevProvIdRef.current) {
      prevProvIdRef.current = value.provinceId;
      loadZones(value.provinceId);
    }
  }, [value.provinceId, loadZones]);

  useEffect(() => {
    if (value.healthZoneId && value.healthZoneId !== prevZoneIdRef.current) {
      prevZoneIdRef.current = value.healthZoneId;
      loadAreas(value.healthZoneId);
    }
  }, [value.healthZoneId, loadAreas]);

  const handleProvince = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = provinces.find(p => p.id === e.target.value);
    const next: Partial<GeoSelection> = {
      provinceId: e.target.value,
      provinceName: opt?.name ?? '',
      healthZoneId: '',
      healthZoneName: '',
      healthAreaId: '',
      healthAreaName: '',
      village: value.village ?? '',
    };
    onChange(next);
    if (e.target.value) loadZones(e.target.value);
    else setZones([]);
    setAreas([]);
  };

  const handleZone = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = zones.find(z => z.id === e.target.value);
    const next: Partial<GeoSelection> = {
      ...value,
      healthZoneId: e.target.value,
      healthZoneName: opt?.name ?? '',
      healthAreaId: '',
      healthAreaName: '',
    };
    onChange(next);
    if (e.target.value) loadAreas(e.target.value);
    else setAreas([]);
  };

  const handleArea = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = areas.find(a => a.id === e.target.value);
    onChange({ ...value, healthAreaId: e.target.value, healthAreaName: opt?.name ?? '' });
  };

  const handleVillage = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, village: e.target.value });
  };

  const [zoneSearch, setZoneSearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  // Filtered lists
  const filteredZones = zones.filter(z => z.name.toLowerCase().includes(zoneSearch.toLowerCase().trim()));
  const filteredAreas = areas.filter(a => a.name.toLowerCase().includes(areaSearch.toLowerCase().trim()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Province */}
      <div style={fieldWrap}>
        <label style={labelStyle}>
          Province / Territoire {required && <span style={{ color: 'var(--warning)' }}>*</span>}
        </label>
        <select
          value={value.provinceId ?? ''}
          onChange={handleProvince}
          disabled={disabled}
          required={required}
          style={inputStyle}
        >
          <option value="">— Sélectionner la province / territoire —</option>
          {provinces.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Health Zone */}
      <div style={fieldWrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={labelStyle}>
            Zone de Santé {required && value.provinceId && <span style={{ color: 'var(--warning)' }}>*</span>}
          </label>
          {zones.length > 8 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({filteredZones.length} / {zones.length})
            </span>
          )}
        </div>

        {zones.length > 8 && (
          <input
            type="text"
            placeholder="🔍 Filtrer les zones..."
            value={zoneSearch}
            onChange={e => setZoneSearch(e.target.value)}
            disabled={disabled || !value.provinceId}
            style={{
              ...inputStyle,
              padding: '6px 10px',
              fontSize: '12px',
              backgroundImage: 'none',
              marginBottom: '2px'
            }}
          />
        )}

        <select
          value={value.healthZoneId ?? ''}
          onChange={handleZone}
          disabled={disabled || !value.provinceId}
          style={{
            ...inputStyle,
            opacity: !value.provinceId ? 0.45 : 1,
            cursor: !value.provinceId ? 'not-allowed' : 'pointer',
          }}
        >
          <option value="">
            {loadingZones ? 'Chargement des zones…' : value.provinceId ? '— Choisir la zone de santé —' : '— Sélectionner la province d\'abord —'}
          </option>
          {filteredZones.map(z => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
      </div>

      {/* Health Area */}
      <div style={fieldWrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={labelStyle}>Aire de Santé</label>
          {areas.length > 8 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({filteredAreas.length} / {areas.length})
            </span>
          )}
        </div>

        {areas.length > 8 && (
          <input
            type="text"
            placeholder="🔍 Filtrer les aires..."
            value={areaSearch}
            onChange={e => setAreaSearch(e.target.value)}
            disabled={disabled || !value.healthZoneId}
            style={{
              ...inputStyle,
              padding: '6px 10px',
              fontSize: '12px',
              backgroundImage: 'none',
              marginBottom: '2px'
            }}
          />
        )}

        <select
          value={value.healthAreaId ?? ''}
          onChange={handleArea}
          disabled={disabled || !value.healthZoneId}
          style={{
            ...inputStyle,
            opacity: !value.healthZoneId ? 0.45 : 1,
            cursor: !value.healthZoneId ? 'not-allowed' : 'pointer',
          }}
        >
          <option value="">
            {loadingAreas ? 'Chargement des aires…' : value.healthZoneId ? '— Choisir l\'aire de santé —' : '— Sélectionner la zone d\'abord —'}
          </option>
          {filteredAreas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Village / Quartier (free text) */}
      {showVillage && (
        <div style={fieldWrap}>
          <label style={labelStyle}>Village / Quartier</label>
          <input
            type="text"
            placeholder="Nom du village ou quartier"
            value={value.village ?? ''}
            onChange={handleVillage}
            disabled={disabled}
            style={{ ...inputStyle, backgroundImage: 'none' }}
          />
        </div>
      )}
    </div>
  );
};

export default GeoSelector;
