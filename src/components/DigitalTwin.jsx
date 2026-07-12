import React, { useState, useEffect, useRef } from 'react';
import { Layers, Camera, AlertTriangle, Wind, Zap, Activity, Info, ShieldAlert, Bike } from 'lucide-react';

const getOffsetNodes = (city) => {
  const centerLat = city?.lat || 19.0760;
  const centerLon = city?.lng || 72.8777;
  const ldnLat = 51.5074;
  const ldnLon = -0.1278;

  return [
    { id: 'weather-1', type: 'aqi', name: `${city?.districts?.[0] || 'Zone A'} Air Quality Hub`, lat: centerLat + (51.4988 - ldnLat), lon: centerLon + (-0.1309 - ldnLon), status: 'Good', metric: 'PM2.5: 18 µg/m³ | PM10: 32 µg/m³', color: '#10b981' },
    { id: 'cam-1', type: 'camera', name: `Traffic CCTV - ${city?.districts?.[1] || 'Zone B'} Junction`, lat: centerLat + (51.5101 - ldnLat), lon: centerLon + (-0.1349 - ldnLon), status: 'Active', metric: 'Live camera feed running', color: '#6366f1' },
    { id: 'cam-2', type: 'camera', name: `Traffic CCTV - ${city?.districts?.[2] || 'Zone C'} Crossing`, lat: centerLat + (51.5079 - ldnLat), lon: centerLon + (-0.0877 - ldnLon), status: 'Active', metric: 'Live camera feed running', color: '#6366f1' },
    { id: 'traffic-1', type: 'traffic', name: `${city?.districts?.[3] || 'Zone D'} Speed Sensor`, lat: centerLat + (51.5055 - ldnLat), lon: centerLon + (-0.0754 - ldnLon), status: 'Congested', metric: 'Speed: 12 km/h | Congestion: 78%', color: '#ef4444' },
    { id: 'traffic-2', type: 'traffic', name: `${city?.districts?.[4] || 'Zone E'} Highway Sensor`, lat: centerLat + (51.5028 - ldnLat), lon: centerLon + (-0.1508 - ldnLon), status: 'Flowing', metric: 'Speed: 65 km/h | Congestion: 12%', color: '#10b981' },
    { id: 'power-1', type: 'power', name: `Substation - ${city?.districts?.[5] || 'Zone F'}`, lat: centerLat + (51.5132 - ldnLat), lon: centerLon + (-0.0886 - ldnLon), status: 'Normal', metric: 'Grid load: 58% | Operating normally', color: '#10b981' },
    { id: 'power-2', type: 'power', name: `Solar Microgrid - ${city?.districts?.[6] || 'Zone G'}`, lat: centerLat + (51.5065 - ldnLat), lon: centerLon + (-0.1115 - ldnLon), status: 'Normal', metric: 'Generation: 1.8 MW', color: '#10b981' },
    { id: 'incident-1', type: 'incident', name: `Water Leakage - ${city?.districts?.[7] || 'Zone H'} Road`, lat: centerLat + (51.5033 - ldnLat), lon: centerLon + (-0.1123 - ldnLon), status: 'Critical', metric: 'Water depth: 10cm | Maintenance dispatch ready', color: '#ef4444' }
  ];
};

function CctvFeed({ node }) {
  const canvasRef = useRef(null);
  const [feedMode, setFeedMode] = useState('ai'); // 'ai' or 'thermal'
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // Simulate objects
    const objects = [
      { x: 30, y: 50, vx: 0.8, vy: 0.2, type: 'Pedestrian', score: 91, w: 20, h: 45 },
      { x: 120, y: 70, vx: -1.2, vy: -0.1, type: 'Car', score: 88, w: 45, h: 30 },
      { x: 220, y: 40, vx: 0.5, vy: 0.3, type: 'Bicycle', score: 76, w: 25, h: 25 },
      { x: 80, y: 90, vx: 1.1, vy: -0.2, type: 'Pedestrian', score: 94, w: 18, h: 42 }
    ];
    
    // Thermal gradient particles
    const heatParticles = Array.from({ length: 40 }, () => ({
      x: Math.random() * 280,
      y: Math.random() * 150,
      r: Math.random() * 15 + 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5
    }));

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (feedMode === 'ai') {
        // AI detection background: dark cyber green tint
        ctx.fillStyle = '#05180c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // Update & draw AI bounding boxes
        objects.forEach(obj => {
          obj.x += obj.vx;
          obj.y += obj.vy;
          
          // Wrap screen
          if (obj.x > canvas.width) obj.x = -obj.w;
          if (obj.x < -obj.w) obj.x = canvas.width;
          if (obj.y > canvas.height) obj.y = -obj.h;
          if (obj.y < -obj.h) obj.y = canvas.height;
          
          // Draw box
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
          
          // Draw label background
          ctx.fillStyle = '#10b981';
          ctx.fillRect(obj.x, obj.y - 12, obj.w + 12, 12);
          
          // Label text
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px monospace';
          ctx.fillText(`${obj.type[0]}:${obj.score}%`, obj.x + 2, obj.y - 3);
        });

        // Scanline effect
        ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
        for (let y = 0; y < canvas.height; y += 4) {
          ctx.fillRect(0, y, canvas.width, 2);
        }
        
      } else {
        // Thermal camera background: dark blue/purple
        ctx.fillStyle = '#020024';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw heat blur points
        heatParticles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          
          if (p.x > canvas.width + 20) p.x = -20;
          if (p.x < -20) p.x = canvas.width + 20;
          if (p.y > canvas.height + 20) p.y = -20;
          if (p.y < -20) p.y = canvas.height + 20;
          
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          grad.addColorStop(0, 'rgba(255, 60, 0, 0.7)');    // core hot red
          grad.addColorStop(0.3, 'rgba(255, 200, 0, 0.4)');  // yellow
          grad.addColorStop(0.6, 'rgba(0, 200, 255, 0.2)');  // cool blue
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // OSD overlays
      ctx.fillStyle = feedMode === 'ai' ? '#10b981' : '#ff3c00';
      ctx.font = '8px monospace';
      
      // REC flashing dot
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(10, 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText('REC', 18, 13);
      ctx.fillText(`FPS: 30`, canvas.width - 45, 13);
      ctx.fillText(`MODE: ${feedMode.toUpperCase()}`, 8, canvas.height - 8);
      ctx.fillText(`CCTV_${node.id.toUpperCase()}`, canvas.width - 70, canvas.height - 8);
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [feedMode, node.id]);

  return (
    <div className="mt-3 pt-3 border-t border-slate-150 dark:border-slate-800 flex flex-col gap-2">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Live Camera Vision Feed</span>
      
      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 h-[140px] bg-black">
        <canvas 
          ref={canvasRef} 
          width={350} 
          height={140} 
          className="w-full h-full block"
        />
        
        <div className="absolute top-2 left-16 text-[8px] font-mono text-white/70 flex gap-2">
          <span>ISO 800</span>
          <span>F/2.8</span>
          <span>1/60s</span>
        </div>
      </div>
      
      <div className="flex gap-2 justify-between mt-1">
        <button 
          onClick={() => setFeedMode('ai')} 
          className={`flex-1 text-[10px] font-extrabold py-1.5 px-2 rounded-lg border transition-all ${
            feedMode === 'ai' 
              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/30 dark:text-emerald-400'
              : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800'
          }`}
        >
          🤖 AI Object Detection
        </button>
        <button 
          onClick={() => setFeedMode('thermal')} 
          className={`flex-1 text-[10px] font-extrabold py-1.5 px-2 rounded-lg border transition-all ${
            feedMode === 'thermal' 
              ? 'bg-rose-100 border-rose-300 text-rose-850 dark:bg-rose-950/40 dark:border-rose-900/30 dark:text-rose-450'
              : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-355 dark:hover:bg-slate-800'
          }`}
        >
          🔥 Thermal Heatmap
        </button>
      </div>
    </div>
  );
}

export default function DigitalTwin({ onSelectNode, activeIncident, nodesList = [], activeTickets = [], onEmergencyDispatch, bikepointsList = [], cityInfo }) {
  const [nodes, setNodes] = useState([]);
  const [emergencyServices, setEmergencyServices] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  
  const [activeLayers, setActiveLayers] = useState({
    camera: true,
    traffic: true,
    aqi: true,
    power: true,
    incident: true,
    emergency: true,
    bikeshare: true,
    heatmap: false
  });
  const [heatmapData, setHeatmapData] = useState([]);
  const heatmarkersRef = useRef({});

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Sync nodes list or offset nodes when cityInfo changes
  useEffect(() => {
    if (nodesList && nodesList.length > 0) {
      setNodes(nodesList);
    } else if (cityInfo) {
      setNodes(getOffsetNodes(cityInfo));
    }
  }, [nodesList, cityInfo]);

  // Fetch heatmap complaint data (city-aware)
  useEffect(() => {
    const params = cityInfo
      ? `?city=${encodeURIComponent(cityInfo.label)}&lat=${cityInfo.lat}&lng=${cityInfo.lng}`
      : '';
    fetch(`/api/heatmap/complaints${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.districts) setHeatmapData(data.districts);
      })
      .catch(err => console.error('Heatmap fetch error:', err));
  }, [cityInfo]);

  // Fetch emergency services on mount
  useEffect(() => {
    fetch('/api/emergency/services')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmergencyServices(data);
        }
      })
      .catch(err => console.error("Failed to load emergency services:", err));
  }, []);

  // Dynamic incident support
  useEffect(() => {
    if (activeIncident && cityInfo) {
      const newNode = {
        id: `incident-dyn-${Date.now()}`,
        type: 'incident',
        name: activeIncident.title || 'Reported Incident',
        lat: activeIncident.lat || cityInfo.lat + (Math.random() * 0.02 - 0.01),
        lon: activeIncident.lon || cityInfo.lng + (Math.random() * 0.02 - 0.01),
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
  }, [activeIncident, cityInfo]);

  // Pan map when selected city updates
  useEffect(() => {
    if (mapInstanceRef.current && cityInfo) {
      mapInstanceRef.current.setView([cityInfo.lat, cityInfo.lng], 13);
    }
  }, [cityInfo]);

  useEffect(() => {
    if (!mapContainerRef.current || !window.L || !cityInfo) return;

    // Create the map centered on the selected Indian city
    const map = window.L.map(mapContainerRef.current).setView([cityInfo.lat, cityInfo.lng], 13);
    mapInstanceRef.current = map;

    // Add high quality tile layer
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    updateMarkers(nodes, emergencyServices, bikepointsList);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergencyServices, bikepointsList]); // reload when emergency services or bikepoints load

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers(nodes, emergencyServices, bikepointsList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, emergencyServices, activeLayers, bikepointsList, heatmapData]);

  const updateMarkers = (currentNodes, services, bikepoints) => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    // Clear old markers
    Object.keys(markersRef.current).forEach(id => {
      map.removeLayer(markersRef.current[id]);
    });
    markersRef.current = {};

    // 1. Add standard IoT nodes
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

    // 2. Add emergency services layer
    if (activeLayers.emergency) {
      services.forEach(svc => {
        const typeColors = {
          hospital: '#ef4444',
          fire_station: '#f97316',
          police: '#3b82f6',
          ambulance: '#6366f1'
        };
        const color = typeColors[svc.type] || '#475569';
        const letter = svc.type === 'hospital' ? 'H' : svc.type === 'fire_station' ? 'F' : svc.type === 'police' ? 'P' : 'A';
        
        const iconHtml = `
          <div style="
            background-color: ${color};
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 9px;
            font-weight: 800;
          ">
            ${letter}
          </div>
        `;

        const customIcon = window.L.divIcon({
          html: iconHtml,
          className: 'custom-emergency-marker',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const marker = window.L.marker([svc.lat, svc.lon], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedNode({
              id: svc.id,
              type: 'emergency',
              name: svc.name,
              status: svc.status,
              metric: `Capacity: ${svc.capacity}`,
              lat: svc.lat,
              lon: svc.lon,
              color: color
            });
          });

        marker.bindPopup(`
          <div class="map-marker-popup">
            <strong style="color: #312e81">${svc.name}</strong><br/>
            <span style="font-size: 11px; color: #475569">Status: ${svc.status} | ${svc.capacity}</span>
          </div>
        `);

        markersRef.current[svc.id] = marker;
      });
    }

    // 3. Add bikeshare layer
    if (activeLayers.bikeshare && bikepoints && bikepoints.length > 0) {
      bikepoints.forEach(bp => {
        const iconHtml = `
          <div style="
            background-color: #0ea5e9;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px #0ea5e9;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 8px;
            font-weight: 800;
          ">
            🚲
          </div>
        `;

        const customIcon = window.L.divIcon({
          html: iconHtml,
          className: 'custom-bikeshare-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = window.L.marker([bp.lat, bp.lon], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedNode({
              id: bp.id,
              type: 'bikeshare',
              name: bp.name,
              status: bp.bikes > 0 ? 'Active' : 'Empty',
              metric: `Bikes: ${bp.bikes} available | Docks: ${bp.empty} empty spaces`,
              lat: bp.lat,
              lon: bp.lon,
              color: '#0ea5e9',
              bikes: bp.bikes,
              empty: bp.empty,
              docks: bp.docks,
              occupancy_pct: bp.occupancy_pct
            });
          });

        marker.bindPopup(`
          <div class="map-marker-popup">
            <strong style="color: #0369a1">${bp.name}</strong><br/>
            <span style="font-size: 11px; color: #0284c7">
              🚲 <strong>${bp.bikes}</strong> available &middot; 🔓 <strong>${bp.empty}</strong> spaces
            </span>
          </div>
        `);

        markersRef.current[bp.id] = marker;
      });
    }

    // 4. Add complaint density heatmap layer
    Object.values(heatmarkersRef.current).forEach(m => map.removeLayer(m));
    heatmarkersRef.current = {};
    if (activeLayers.heatmap && heatmapData.length > 0) {
      heatmapData.forEach(district => {
        const count = district.count || 0;
        const radius = 300 + count * 120;
        const color = count === 0 ? '#10b981' : count <= 2 ? '#f59e0b' : '#f43f5e';
        const opacity = count === 0 ? 0.15 : 0.25 + count * 0.07;
        const circle = window.L.circle([district.lat, district.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: Math.min(opacity, 0.6),
          weight: 2,
        }).addTo(map);
        circle.bindPopup(`
          <div class="map-marker-popup">
            <strong style="color:${color}">${district.district}</strong><br/>
            <span style="font-size:11px">📍 <strong>${count}</strong> active complaint${count !== 1 ? 's' : ''}</span><br/>
            <span style="font-size:10px;color:#64748b">Top: ${district.top_category}</span>
          </div>
        `);
        heatmarkersRef.current[district.district] = circle;
      });
    }
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

  const handleEmergencyDispatch = (serviceId, ticketId) => {
    fetch('/api/emergency/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: serviceId, ticket_id: ticketId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          if (onEmergencyDispatch) {
            onEmergencyDispatch();
          }
          setSelectedNode(null);
        }
      })
      .catch(err => console.error("Emergency dispatch failed:", err));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'camera': return <Camera className="w-4 h-4 text-indigo-500" />;
      case 'traffic': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'aqi': return <Wind className="w-4 h-4 text-orange-500" />;
      case 'power': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'incident': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'emergency': return <ShieldAlert className="w-4 h-4 text-indigo-650" />;
      case 'bikeshare': return <Bike className="w-4 h-4 text-sky-500" />;
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
          <span className="card-subtitle">Real-time OpenStreetMap overlay of {cityInfo?.label || 'City'} municipal IoT network</span>
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
          <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm z-[1000] auto-focus-info animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {getIcon(selectedNode.type)}
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">{selectedNode.type}</span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{selectedNode.name}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-350 mb-3">{selectedNode.metric}</p>
            
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2 rounded-lg text-[11px] border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedNode.status === 'Active' || selectedNode.status === 'Good' || selectedNode.status === 'Flowing' || selectedNode.status === 'Normal' || selectedNode.status === 'Optimal' || selectedNode.status === 'Ready'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : selectedNode.status === 'Resolving'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450'
              }`}>
                {selectedNode.status}
              </span>
            </div>

            {/* Camera vision details */}
            {selectedNode.type === 'camera' && (
              <CctvFeed node={selectedNode} />
            )}

            {/* Bikeshare station details */}
            {selectedNode.type === 'bikeshare' && (
              <div className="mt-3 pt-3 border-t border-slate-150 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Available Bikes:</span>
                  <span className="font-bold text-sky-600 font-mono text-sm">{selectedNode.bikes}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Empty Docks:</span>
                  <span className="font-bold text-slate-600 dark:text-slate-400 font-mono text-sm">{selectedNode.empty}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-sky-500 rounded-full" 
                    style={{ width: (selectedNode.occupancy_pct || 0) + '%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-450 text-right font-medium">
                  Occupancy: {selectedNode.occupancy_pct || 0}%
                </span>
              </div>
            )}

            {/* Ticket dispatch dropdown configuration */}
            {selectedNode.type === 'emergency' && (
              <div className="mt-3 pt-3 border-t border-slate-150 dark:border-slate-800">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">DISPATCH TO ACTIVE TICKET</label>
                {activeTickets.filter(t => t.status !== 'Resolved').length === 0 ? (
                  <p className="text-[11px] text-slate-450 italic">No active citizen complaints to coordinate.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <select 
                      id="emergency-dispatch-select"
                      className="form-input text-xs py-1 px-1.5"
                    >
                      {activeTickets.filter(t => t.status !== 'Resolved').map(t => (
                        <option key={t.id} value={t.id}>{t.id} - {t.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const selectEl = document.getElementById('emergency-dispatch-select');
                        if (selectEl && selectEl.value) {
                          handleEmergencyDispatch(selectedNode.id, selectEl.value);
                        }
                      }}
                      className="btn btn-primary text-xs py-1.5 w-full flex items-center justify-center gap-1.5"
                      style={{ cursor: 'pointer' }}
                    >
                      <span>Dispatch Roster Unit</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {['Congested', 'Critical', 'Active'].includes(selectedNode.status) && selectedNode.type !== 'emergency' && (
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
