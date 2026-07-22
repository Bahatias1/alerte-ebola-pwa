import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { RefreshCw, MapPin, Layers } from 'lucide-react';

declare const L: any;

export const MapPage: React.FC = () => {
  const { healthCenters, isOnline, selectedDisease } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geojsonLayerRef = useRef<any>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('RDC - Global');
  const [provinceStats, setProvinceStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

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

  const handleSelectProvince = (provName: string) => {
    setSelectedProvince(provName);
    const key = provName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (provinceCentroids[key] && mapRef.current) {
      mapRef.current.flyTo(provinceCentroids[key], 7, { animate: true, duration: 1 });
    }
  };

  const fetchProvinceDetails = async (provinceName: string) => {
    setStatsLoading(true);
    try {
      if (isOnline) {
        let query = supabase.from('stats_updates').select().eq('province', provinceName);
        if (selectedDisease?.code) {
          query = query.eq('disease_code', selectedDisease.code);
        }
        const { data, error } = await query.order('id', { ascending: false }).limit(1);
          
        if (!error && data && data.length > 0) {
          setProvinceStats(data[0]);
        } else {
          setProvinceStats({
            new_cases: 0,
            confirmed_cases: 0,
            new_deaths: 0,
            total_deaths: 0,
            source: 'MSP RDC / WHO',
            summary: `Aucune flambée active enregistrée pour ${selectedDisease?.code || 'pathogène'} en ${provinceName}.`
          });
        }
      } else {
        setProvinceStats({
          new_cases: 0,
          confirmed_cases: 0,
          new_deaths: 0,
          total_deaths: 0,
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
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-2.5, 23.5], 5);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      // Force Leaflet container recalculation to prevent blank/gray rendering
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);

      // GeoJSON boundaries
      fetch('/province_boundaries_fallback.json')
        .then(res => res.json())
        .then(data => {
          geojsonLayerRef.current = L.geoJSON(data, {
            style: (feature: any) => {
              const name = feature.properties.name || feature.properties.province || '';
              const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              
              let fillColor = '#10B981';
              if (['nord-kivu', 'ituri', 'kinshasa'].includes(normalized)) {
                fillColor = '#EF4444';
              } else if (['equateur', 'sud-kivu', 'kongo-central', 'tshopo'].includes(normalized)) {
                fillColor = '#F59E0B';
              }

              return {
                fillColor,
                weight: 1.5,
                opacity: 0.8,
                color: 'rgba(255,255,255,0.2)',
                fillOpacity: 0.3
              };
            },
            onEachFeature: (feature: any, layer: any) => {
              const provinceName = feature.properties.name || feature.properties.province || 'Province';
              layer.on({
                mouseover: (e: any) => {
                  e.target.setStyle({ fillOpacity: 0.6, weight: 2, color: 'var(--accent-mint)' });
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
          }).addTo(mapRef.current);
        })
        .catch(err => console.error('Failed to load GeoJSON:', err));

      // Health center markers
      healthCenters.forEach(center => {
        if (center.latitude && center.longitude) {
          const markerHtml = `<div style="width: 12px; height: 12px; background-color: var(--accent-mint); border: 2px solid #000; border-radius: 50%; box-shadow: 0 0 8px rgba(20,184,166,0.8);"></div>`;
          const customIcon = L.divIcon({ html: markerHtml, className: 'custom-leaflet-marker', iconSize: [12, 12] });
          L.marker([center.latitude, center.longitude], { icon: customIcon })
            .addTo(mapRef.current)
            .bindPopup(`
              <div style="font-family: sans-serif; color: #1a1a1a; padding: 4px;">
                <h4 style="margin: 0 0 4px; font-weight: 700; color: #10B981;">🏥 ${center.name}</h4>
                <p style="margin: 0; font-size: 11px;">Zone: ${center.province}</p>
                <p style="margin: 0; font-size: 11px;">Lits libres: <b>${center.bedsAvailable}/${center.totalBeds}</b></p>
              </div>
            `);
        }
      });
    }

    // Resize observer listener for container invalidateSize
    const handleResize = () => {
      if (mapRef.current) mapRef.current.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [healthCenters, selectedDisease]);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 120px)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', backgroundColor: '#0B0F17' }} />

      {/* Floating Header Banner */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', backgroundColor: 'rgba(11, 15, 23, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={18} color="var(--accent-mint)" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF' }}>
              Carte Surveillance GIS — {selectedDisease?.code || 'MVE'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              26 Provinces • Zones de Santé • Centers CTE
            </div>
          </div>
        </div>
      </div>

      {/* Floating Province Stats Drawer Panel */}
      <div style={{ position: 'absolute', bottom: '24px', left: '16px', right: '16px', zIndex: 10, backgroundColor: 'rgba(11, 15, 23, 0.92)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="var(--accent-mint)" />
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFF', margin: 0 }}>{selectedProvince}</h3>
          </div>
          <span style={{ fontSize: '10px', backgroundColor: 'rgba(20,184,166,0.2)', color: 'var(--accent-mint)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
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
