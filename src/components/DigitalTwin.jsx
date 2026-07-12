import React, { useState, useEffect, useRef } from 'react';
import { Layers, Camera, AlertTriangle, Wind, Zap, Activity, Info } from 'lucide-react';

const initialNodes = [
  { id: 'weather-1', type: 'aqi', name: 'Westminster Air Quality Hub', lat: 51.4988, lon: -0.1309, status: 'Good', metric: 'PM2.5: 8 µg/m³ | PM10: 12 µg/m³', color: '#10b981' },
  { id: 'cam-1', type: 'camera', name: 'Traffic CCTV - Piccadilly Circus', lat: 51.5101, lon: -0.1349, status: 'Active', metric: 'Live camera feed running', color: '#6366f1' },
  { id: 'cam-2', type: 'camera', name: 'Traffic CCTV - London Bridge North', lat: 51.5079, lon: -0.0877, status: 'Active', metric: 'Live camera feed running', color: '#6366f1' },
  { id: 'traffic-1', type: 'traffic', name: 'Tower Bridge Speed Sensor', lat: 51.5055, lon: -0.0754, status: 'Congested', metric: 'Speed: 8 mph | Congestion: 84%', color: '#ef4444' },
  { id: 'traffic-2', type: 'traffic', name: 'Hyde Park Underpass Sensor', lat: 51.5028, lon: -0.1508, status: 'Flowing', metric: 'Speed: 38 mph | Congestion: 15%', color: '#10b981' },
  { id: 'power-1', type: 'power', name: 'National Grid Substation - Bank', lat: 51.5132, lon: -0.0886, status: 'Normal', metric: 'Grid load: 64% | Operating normally', color: '#10b981' },
  { id: 'power-2', type: 'power', name: 'Solar Microgrid - London South Bank', lat: 51.5065, lon: -0.1115, status: 'Normal', metric: 'Generation: 1.2 MW', color: '#10b981' },
  { id: 'incident-1', type: 'incident', name: 'Water Main Burst - Waterloo Road', lat: 51.5033, lon: -0.1123, status: 'Critical', metric: 'Water depth: 15cm | Response team dispatched', color: '#ef4444' }
];

export default function DigitalTwin({ onSelectNode, activeIncident, nodesList = [] }) {
  const [nodes, setNodes] = useState(nodesList.length > 0 ? nodesList : initialNodes);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeLayers, setActiveLayers] = useState({
    camera: true,
    traffic: true,
    aqi: true,
    power: true,
    incident: true
  });

  useEffect(() => {
    if (nodesList && nodesList.length > 0) {
      setNodes(nodesList);
    }
  }, [nodesList]);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Dynamic incident support
  useEffect(() => {
    if (activeIncident) {
      const newNode = {
        id: `incident-dyn-${Date.now()}`,
        type: 'incident',
        name: activeIncident.title || 'Reported Incident',
        lat: activeIncident.lat || 51.5074 + (Math.random() * 0.02 - 0.01),
        lon: activeIncident.lon || -0.1278 + (Math.random() * 0.02 - 0.01),
        status: 'Active',
        metric: `Description: ${activeIncident.description || 'Reported via Copilot'}`,
        color: '#ef4444'
      };
      setNodes(prev => [newNode, ...prev.filter(n => !n.id.startsWith('incident-dyn'))]);
      setSelectedNode(newNode);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([newNode.lat, newNode.lon], 14);
      }
    }
  }, [activeIncident]);

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    // Create the map centered on London
    const map = window.L.map(mapContainerRef.current).setView([51.505, -0.11], 13);
    mapInstanceRef.current = map;

    // Add high quality tile layer
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    updateMarkers(nodes);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers(nodes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, activeLayers]);

  const updateMarkers = (currentNodes) => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    // Clear old markers
    Object.keys(markersRef.current).forEach(id => {
      map.removeLayer(markersRef.current[id]);
    });
    markersRef.current = {};

    // Add new markers based on filters
    currentNodes.forEach(node => {
      if (!activeLayers[node.type]) return;

      const iconHtml = `
        <div style="
          background-color: ${node.color};
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px ${node.color};
        " class="${node.status === 'Congested' || node.status === 'Critical' ? 'pulse-dot' : ''}"></div>
      `;

      const customIcon = window.L.divIcon({
        html: iconHtml,
        className: 'custom-map-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = window.L.marker([node.lat, node.lon], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          setSelectedNode(node);
          if (onSelectNode) onSelectNode(node);
        });

      marker.bindPopup(`
        <div class="map-marker-popup">
          <strong style="color: #1e293b">${node.name}</strong><br/>
          <span style="font-size: 11px; color: #64748b">${node.metric}</span>
        </div>
      `);

      markersRef.current[node.id] = marker;
    });
  };

  const toggleLayer = (layer) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleDispatch = (node) => {
    setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'Resolving', color: '#f59e0b', metric: `${n.name} - Dispatch deployed` } : n));
    setSelectedNode(prev => ({ ...prev, status: 'Resolving', color: '#f59e0b', metric: `${prev.name} - Dispatch deployed` }));
    if (onSelectNode) {
      onSelectNode({ ...node, action: 'dispatch' });
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'camera': return <Camera className="w-4 h-4 text-indigo-500" />;
      case 'traffic': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'aqi': return <Wind className="w-4 h-4 text-orange-500" />;
      case 'power': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'incident': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div>
          <h3 className="card-title">
            <Layers className="w-5 h-5 text-indigo-600" /> Digital Twin Live Map
          </h3>
          <span className="card-subtitle">Real-time OpenStreetMap overlay of London municipal IoT network</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(activeLayers).map(layer => (
            <button
              key={layer}
              onClick={() => toggleLayer(layer)}
              className={`btn btn-secondary flex items-center gap-1.5 py-1 px-3 text-xs rounded-full ${activeLayers[layer] ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60' : 'opacity-60'}`}
            >
              {getIcon(layer)}
              <span className="capitalize">{layer}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1" style={{ minHeight: '350px' }}>
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Floating Node Information Card overlay */}
        {selectedNode && (
          <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm z-[1000] animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {getIcon(selectedNode.type)}
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">{selectedNode.type}</span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{selectedNode.name}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{selectedNode.metric}</p>
            
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2 rounded-lg text-[11px] border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedNode.status === 'Active' || selectedNode.status === 'Good' || selectedNode.status === 'Flowing' || selectedNode.status === 'Normal'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : selectedNode.status === 'Resolving'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450'
              }`}>
                {selectedNode.status}
              </span>
            </div>

            {['Congested', 'Critical', 'Active'].includes(selectedNode.status) && (
              <button
                onClick={() => handleDispatch(selectedNode)}
                className="btn-3d btn-primary text-xs w-full mt-3 flex items-center justify-center gap-1.5"
                style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Dispatch Resolution Team</span>
              </button>
            )}
          </div>
        )}

        <div className="map-legend absolute bottom-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-200 dark:border-slate-800 z-[1000] shadow-md">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1 block">Telemetry Status</span>
          <div className="legend-item flex items-center gap-2 mb-1 text-[11px]"><div className="legend-color w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981' }}></div><span>Normal / Good</span></div>
          <div className="legend-item flex items-center gap-2 mb-1 text-[11px]"><div className="legend-color w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div><span>Elevated / High Load</span></div>
          <div className="legend-item flex items-center gap-2 text-[11px]"><div className="legend-color w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }}></div><span>Alert / Congested</span></div>
        </div>
      </div>
    </div>
  );
}
