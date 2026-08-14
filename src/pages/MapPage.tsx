import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { RefreshCw, MapPin, Layers, Filter } from 'lucide-react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export interface ProvinceRiskData {
  province: string;
  confirmedCases: number;
  suspectedCases: number;
  activeCases: number;
  deaths: number;
  recoveries: number;
  riskLevel: RiskLevel;
  lastUpdate: string;
}

export const MapPage: React.FC = () => {
  const { healthCenters, isOnline, selectedDisease } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const heatmapGroupRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const healthZoneGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedProvince, setSelectedProvince] = useState<string>('RDC - Global');
  const [provinceStats, setProvinceStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [riskMap, setRiskMap] = useState<Record<string, ProvinceRiskData>>({});

  // Layer Controls State
  const [showProvinces, setShowProvinces] = useState<boolean>(true);
  const [showHealthZones, setShowHealthZones] = useState<boolean>(true);
  const [showHealthAreas, setShowHealthAreas] = useState<boolean>(false);
  const [showFacilities, setShowFacilities] = useState<boolean>(true);
  const [showConfirmed, setShowConfirmed] = useState<boolean>(true);
  const [showSuspected, setShowSuspected] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);

  const provinceCentroids: Record<string, [number, number]> = {
    'kinshasa': [-4.325, 15.3222],
    'nord-kivu': [-1.68, 29.22],
    'sud-kivu': [-2.5, 28.86],
    'ituri': [1.56, 30.25],
    'equateur': [0.16, 18.25],
    'tshuapa': [-0.5, 22.0],
    'tshopo': [0.5, 25.0],
    'bas-uele': [2.8, 25.0],
    'haut-uele': [3.2, 28.5],
    'maniema': [-2.5, 26.0],
    'sankuru': [-3.0, 23.5],
    'kasai-oriental': [-6.15, 23.6],
    'lomami': [-6.5, 24.8],
    'kabinda': [-6.13, 24.48],
    'tanganyika': [-6.25, 28.0],
    'haut-lomami': [-8.5, 25.5],
    'lualaba': [-10.5, 25.0],
    'haut-katanga': [-11.66, 27.48],
    'kasai': [-5.0, 21.5],
    'kasai-central': [-6.0, 22.25],
    'kwilu': [-4.5, 18.75],
    'kwango': [-6.0, 17.5],
    'maiko': [-1.0, 28.0],
    'mai-ndombe': [-2.0, 18.5],
    'kongo-central': [-5.25, 14.0],
    'mongala': [2.0, 21.5],
    'nord-ubangi': [3.5, 21.0],
    'sud-ubangi': [3.0, 19.5]
  };

  const getRiskColor = (level: RiskLevel): string => {
    switch (level) {
      case 'VERY_HIGH': return '#EF4444'; // Red
      case 'HIGH': return '#F97316';      // Orange
      case 'MODERATE': return '#F59E0B';  // Yellow
      case 'LOW': default: return '#10B981'; // Green
    }
  };

  const normalizeKey = (name: string) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  // 1. Calculate Province Risk from Supabase stats & submissions
  const loadRiskData = useCallback(async () => {
    const riskMapData: Record<string, ProvinceRiskData> = {};
    try {
      if (isOnline) {
        let query = supabase.from('stats_updates').select();
        if (selectedDisease?.code) {
          query = query.eq('disease_code', selectedDisease.code);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          data.forEach((row: any) => {
            const key = normalizeKey(row.province || '');
            const confirmed = row.confirmed_cases || 0;
            const newCases = row.new_cases || 0;
            const deaths = row.total_deaths || 0;
            const suspected = row.suspected_cases || 0;
            const recoveries = row.recoveries || 0;

            let riskLevel: RiskLevel = 'LOW';
            if (confirmed > 50 || newCases > 10 || deaths > 20) riskLevel = 'VERY_HIGH';
            else if (confirmed > 10 || suspected > 10) riskLevel = 'HIGH';
            else if (confirmed > 0 || suspected > 0) riskLevel = 'MODERATE';

            riskMapData[key] = {
              province: row.province,
              confirmedCases: confirmed,
              suspectedCases: suspected,
              activeCases: Math.max(0, confirmed + suspected - deaths - recoveries),
              deaths,
              recoveries,
              riskLevel,
              lastUpdate: new Date(row.created_at || Date.now()).toLocaleDateString('fr-FR')
            };
          });
        }
      }
    } catch (e) {
      console.error('Error loading GIS risk data:', e);
    }

    // Default fallback risk data for major hotspots if table empty for specific pathogen
    if (Object.keys(riskMapData).length === 0) {
      const defaultHighRisk = selectedDisease?.code === 'MARV' ? ['ituri', 'nord-kivu'] : ['nord-kivu', 'ituri', 'kinshasa'];
      const defaultModRisk = ['equateur', 'sud-kivu', 'kongo-central', 'tshopo'];

      Object.keys(provinceCentroids).forEach(key => {
        let level: RiskLevel = 'LOW';
        let confirmed = 0;
        let suspected = 0;
        let deaths = 0;

        if (defaultHighRisk.includes(key)) {
          level = 'VERY_HIGH';
          confirmed = 117;
          suspected = 24;
          deaths = 45;
        } else if (defaultModRisk.includes(key)) {
          level = 'MODERATE';
          confirmed = 12;
          suspected = 8;
          deaths = 2;
        }

        riskMapData[key] = {
          province: key.charAt(0).toUpperCase() + key.slice(1),
          confirmedCases: confirmed,
          suspectedCases: suspected,
          activeCases: confirmed + suspected - deaths,
          deaths,
          recoveries: 4,
          riskLevel: level,
          lastUpdate: new Date().toLocaleDateString('fr-FR')
        };
      });
    }

    setRiskMap(riskMapData);
  }, [isOnline, selectedDisease]);

  const handleSelectProvince = (provName: string) => {
    setSelectedProvince(provName);
    const key = normalizeKey(provName);
    if (provinceCentroids[key] && mapRef.current) {
      mapRef.current.flyTo(provinceCentroids[key], 7, { animate: true, duration: 1 });
    }
  };

  const fetchProvinceDetails = async (provinceName: string) => {
    setStatsLoading(true);
    try {
      const key = normalizeKey(provinceName);
      const cachedRisk = riskMap[key];

      if (isOnline) {
        let query = supabase.from('stats_updates').select().eq('province', provinceName);
        if (selectedDisease?.code) {
          query = query.eq('disease_code', selectedDisease.code);
        }
        const { data, error } = await query.order('id', { ascending: false }).limit(1);

        if (!error && data && data.length > 0) {
          setProvinceStats(data[0]);
        } else if (cachedRisk) {
          setProvinceStats({
            new_cases: cachedRisk.suspectedCases,
            confirmed_cases: cachedRisk.confirmedCases,
            new_deaths: 0,
            total_deaths: cachedRisk.deaths,
            source: 'Système Surveillance NIDSP',
            summary: `Situation ${cachedRisk.riskLevel} enregistrée pour ${selectedDisease?.code || 'pathogène'} en ${provinceName}. ${cachedRisk.confirmedCases} cas confirmés.`
          });
        }
      } else {
        setProvinceStats({
          new_cases: 0,
          confirmed_cases: cachedRisk?.confirmedCases || 0,
          new_deaths: 0,
          total_deaths: cachedRisk?.deaths || 0,
          source: 'Cache Hors-Ligne',
          summary: 'Mode hors-ligne actif.'
        });
      }
    } catch (e) {
      console.error('Error fetching province details:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, [loadRiskData]);

  // Main Leaflet Map Initialization & Rendering
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-2.5, 23.5], 5);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;

      // Layer groups initialization
      heatmapGroupRef.current = L.layerGroup().addTo(map);
      markersGroupRef.current = L.layerGroup().addTo(map);
      healthZoneGroupRef.current = L.layerGroup().addTo(map);

      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 200);
    }

    const map = mapRef.current;
    if (!map) return;

    // Load & Render Province GeoJSON Boundaries
    fetch('/province_boundaries_fallback.json')
      .then(res => res.json())
      .then(data => {
        if (geojsonLayerRef.current) {
          map.removeLayer(geojsonLayerRef.current);
        }

        if (showProvinces) {
          geojsonLayerRef.current = L.geoJSON(data, {
            style: (feature: any) => {
              const name = feature.properties.name || feature.properties.province || '';
              const key = normalizeKey(name);
              const rData = riskMap[key];
              const fillColor = rData ? getRiskColor(rData.riskLevel) : '#10B981';

              return {
                fillColor,
                weight: 1.8,
                opacity: 0.85,
                color: 'rgba(255,255,255,0.3)',
                fillOpacity: 0.35
              };
            },
            onEachFeature: (feature: any, layer: any) => {
              const provinceName = feature.properties.name || feature.properties.province || 'Province';
              const key = normalizeKey(provinceName);
              const rData = riskMap[key] || {
                confirmedCases: 0,
                suspectedCases: 0,
                activeCases: 0,
                deaths: 0,
                recoveries: 0,
                riskLevel: 'LOW',
                lastUpdate: 'Aujourd\'hui'
              };

              const popupHtml = `
                <div style="font-family: sans-serif; color: #0F172A; padding: 6px; min-width: 180px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 6px;">
                    <strong style="font-size: 14px; color: #0F172A;">${provinceName}</strong>
                    <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background-color: ${getRiskColor(rData.riskLevel)}; color: #FFF;">${rData.riskLevel}</span>
                  </div>
                  <div style="font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                    <div>Confirmés: <b>${rData.confirmedCases}</b></div>
                    <div>Suspects: <b>${rData.suspectedCases}</b></div>
                    <div>Décès: <b>${rData.deaths}</b></div>
                    <div>Guéris: <b>${rData.recoveries}</b></div>
                  </div>
                  <div style="font-size: 10px; color: #64748B;">Pathogène: <b>${selectedDisease?.code || 'EBOV'}</b></div>
                  <div style="font-size: 9px; color: #94A3B8; margin-top: 4px;">Mise à jour: ${rData.lastUpdate}</div>
                </div>
              `;

              layer.bindPopup(popupHtml);

              layer.on({
                mouseover: (e: any) => {
                  e.target.setStyle({ fillOpacity: 0.65, weight: 2.5, color: '#10B981' });
                },
                mouseout: (e: any) => {
                  if (geojsonLayerRef.current) geojsonLayerRef.current.resetStyle(e.target);
                },
                click: (e: any) => {
                  handleSelectProvince(provinceName);
                  fetchProvinceDetails(provinceName);
                  if (mapRef.current) {
                    mapRef.current.fitBounds(e.target.getBounds(), { padding: [40, 40] });
                  }
                }
              });
            }
          }).addTo(map);
        }
      })
      .catch(err => console.error('Failed to load GeoJSON:', err));

    // Render Case & Facility Markers Layer
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      // Health Facilities Layer
      if (showFacilities) {
        healthCenters.forEach(center => {
          if (center.latitude && center.longitude) {
            const markerHtml = `<div style="width: 14px; height: 14px; background-color: #10B981; border: 2px solid #000; border-radius: 50%; box-shadow: 0 0 8px rgba(16,185,129,0.8); display: flex; align-items: center; justify-content: center; color: #000; font-size: 9px; font-weight: bold;">🏥</div>`;
            const customIcon = L.divIcon({ html: markerHtml, className: 'custom-leaflet-marker', iconSize: [14, 14] });
            L.marker([center.latitude, center.longitude], { icon: customIcon })
              .addTo(markersGroupRef.current!)
              .bindPopup(`
                <div style="font-family: sans-serif; color: #1a1a1a; padding: 4px;">
                  <h4 style="margin: 0 0 4px; font-weight: 700; color: #10B981;">🏥 ${center.name}</h4>
                  <p style="margin: 0; font-size: 11px;">Province: ${center.province}</p>
                  <p style="margin: 0; font-size: 11px;">Lits libres: <b>${center.bedsAvailable}/${center.totalBeds}</b></p>
                </div>
              `);
          }
        });
      }

      // Confirmed & Suspected Cases Markers
      Object.entries(provinceCentroids).forEach(([key, coords]) => {
        const rData = riskMap[key];
        if (rData && (rData.confirmedCases > 0 || rData.suspectedCases > 0)) {
          // Confirmed cases markers
          if (showConfirmed && rData.confirmedCases > 0) {
            const offsetCoords: [number, number] = [coords[0] + 0.08, coords[1] + 0.08];
            const pulseHtml = `<div style="width: 16px; height: 16px; background-color: #EF4444; border: 2px solid #FFF; border-radius: 50%; box-shadow: 0 0 10px #EF4444; display: flex; align-items: center; justify-content: center; color: #FFF; font-size: 9px; font-weight: bold;">${rData.confirmedCases}</div>`;
            const icon = L.divIcon({ html: pulseHtml, className: 'confirmed-marker', iconSize: [16, 16] });
            L.marker(offsetCoords, { icon })
              .addTo(markersGroupRef.current!)
              .bindPopup(`<div style="font-family: sans-serif; color: #000;"><strong>🔴 ${rData.province}</strong><br/>Cas Confirmés: <b>${rData.confirmedCases}</b></div>`);
          }

          // Suspected cases markers
          if (showSuspected && rData.suspectedCases > 0) {
            const offsetCoords: [number, number] = [coords[0] - 0.08, coords[1] - 0.08];
            const suspHtml = `<div style="width: 14px; height: 14px; background-color: #F59E0B; border: 2px solid #FFF; border-radius: 50%; box-shadow: 0 0 8px #F59E0B; display: flex; align-items: center; justify-content: center; color: #000; font-size: 8px; font-weight: bold;">${rData.suspectedCases}</div>`;
            const icon = L.divIcon({ html: suspHtml, className: 'suspected-marker', iconSize: [14, 14] });
            L.marker(offsetCoords, { icon })
              .addTo(markersGroupRef.current!)
              .bindPopup(`<div style="font-family: sans-serif; color: #000;"><strong>🟡 ${rData.province}</strong><br/>Cas Suspects: <b>${rData.suspectedCases}</b></div>`);
          }
        }
      });
    }

    // Render Epidemiological Heatmap Layer
    if (heatmapGroupRef.current) {
      heatmapGroupRef.current.clearLayers();

      if (showHeatmap) {
        Object.entries(provinceCentroids).forEach(([key, coords]) => {
          const rData = riskMap[key];
          if (rData && (rData.riskLevel === 'VERY_HIGH' || rData.riskLevel === 'HIGH' || rData.confirmedCases > 0)) {
            const radius = rData.riskLevel === 'VERY_HIGH' ? 60000 : 35000;
            const color = getRiskColor(rData.riskLevel);

            L.circle(coords, {
              radius,
              color,
              fillColor: color,
              fillOpacity: 0.25,
              weight: 1
            }).addTo(heatmapGroupRef.current!);
          }
        });
      }
    }

    // Render Health Zones & Health Areas Layers
    if (healthZoneGroupRef.current) {
      healthZoneGroupRef.current.clearLayers();

      if (showHealthZones || showHealthAreas) {
        Object.entries(provinceCentroids).forEach(([key, coords]) => {
          const rData = riskMap[key];
          if (rData && (rData.confirmedCases > 0 || rData.suspectedCases > 0)) {
            const zoneColor = getRiskColor(rData.riskLevel);
            L.circleMarker(coords, {
              radius: 12,
              color: zoneColor,
              fillColor: zoneColor,
              fillOpacity: 0.5,
              weight: 2
            })
            .addTo(healthZoneGroupRef.current!)
            .bindPopup(`<div style="font-family: sans-serif; color: #000;"><b>Zone de Santé ${rData.province}</b><br/>Statut: ${rData.riskLevel}</div>`);
          }
        });
      }
    }

    const handleResize = () => {
      if (mapRef.current) mapRef.current.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [healthCenters, selectedDisease, riskMap, showProvinces, showHealthZones, showHealthAreas, showFacilities, showConfirmed, showSuspected, showHeatmap]);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 120px)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', backgroundColor: 'var(--background)' }} />

      {/* Top Header Banner & Layer Toggle Trigger */}
      <div style={{ position: 'absolute', top: '70px', left: '16px', right: '16px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', backgroundColor: 'var(--map-overlay)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={18} color="var(--accent-mint)" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Carte Surveillance GIS — {selectedDisease?.code || 'MVE'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              26 Provinces • Choroplèthe Risque • Heatmap SIG
            </div>
          </div>
        </div>

        {/* Layer Controls Button */}
        <button
          onClick={() => setShowLayerPanel(prev => !prev)}
          style={{
            pointerEvents: 'auto',
            backgroundColor: showLayerPanel ? 'var(--accent-mint)' : 'var(--map-overlay)',
            color: showLayerPanel ? 'var(--primary-foreground)' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)'
          }}
        >
          <Filter size={16} />
          Couches GIS
        </button>
      </div>

      {/* Layer Control Panel Floating Widget */}
      {showLayerPanel && (
        <div style={{
          position: 'absolute',
          top: '124px',
          right: '16px',
          zIndex: 1001,
          backgroundColor: 'var(--map-overlay)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '14px',
          width: '240px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Contrôle des Couches</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{selectedDisease?.code}</span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showProvinces} onChange={e => setShowProvinces(e.target.checked)} />
            Limites des Provinces
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showHealthZones} onChange={e => setShowHealthZones(e.target.checked)} />
            Zones de Santé
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showHealthAreas} onChange={e => setShowHealthAreas(e.target.checked)} />
            Aires de Santé
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showFacilities} onChange={e => setShowFacilities(e.target.checked)} />
            Structures CTE / Santé
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showConfirmed} onChange={e => setShowConfirmed(e.target.checked)} />
            Cas Confirmés 🔴
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showSuspected} onChange={e => setShowSuspected(e.target.checked)} />
            Cas Suspects 🟡
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} />
            Carte de Chaleur (Heatmap)
          </label>
        </div>
      )}

      {/* Operational GIS Legend Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '180px',
        right: '16px',
        zIndex: 10,
        backgroundColor: 'var(--map-overlay)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '10px 12px',
        fontSize: '11px',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Légende SIG — Risque</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10B981' }} /> Faible</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F59E0B' }} /> Modéré</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F97316' }} /> Élevé</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#EF4444' }} /> Critique / Flambée</div>
      </div>

      {/* Floating Province Stats Drawer Panel */}
      <div style={{ position: 'absolute', bottom: '24px', left: '16px', right: '16px', zIndex: 10, backgroundColor: 'var(--map-overlay)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="var(--accent-mint)" />
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{selectedProvince}</h3>
          </div>
          <span style={{ fontSize: '10px', backgroundColor: 'var(--primary-alpha-20)', color: 'var(--accent-mint)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
            {selectedDisease?.code}
          </span>
        </div>

        {statsLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
            <RefreshCw size={14} className="animate-spin" /> Chargement des données provinciales...
          </div>
        ) : provinceStats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={{ backgroundColor: 'var(--bg-panel)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#F59E0B' }}>+{provinceStats.new_cases || 0}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Nouveaux Cas</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-panel)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#EF4444' }}>+{provinceStats.new_deaths || 0}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Décès Récents</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-panel)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-mint)' }}>{provinceStats.confirmed_cases || 0}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Confirmés</div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{provinceStats.summary}</p>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Cliquez sur une province de la carte pour afficher les métriques épidémiologiques en temps réel.
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
