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
  const [activeHazard, setActiveHazard] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  
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

        // Draw Injected Hazards
        if (activeHazard === 'pothole') {
          // Cracked Pothole Graphic
          ctx.fillStyle = '#1c1917';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(170, 75, 18, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(160, 75);
          ctx.lineTo(180, 75);
          ctx.moveTo(170, 70);
          ctx.lineTo(170, 80);
          ctx.stroke();

          // Neon BB
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(148, 62, 44, 26);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(148, 50, 88, 12);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('🚨 POTHOLE DISTRESS (92%)', 151, 59);
        } else if (activeHazard === 'breakdown') {
          // Red Breakdown Car
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(200, 60, 46, 28);
          ctx.fillStyle = '#000000';
          ctx.fillRect(205, 57, 10, 3);
          ctx.fillRect(230, 57, 10, 3);
          ctx.fillRect(205, 88, 10, 3);
          ctx.fillRect(230, 88, 10, 3);

          if (Math.floor(Date.now() / 300) % 2 === 0) {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(202, 64, 3, 0, Math.PI * 2);
            ctx.arc(202, 84, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Neon BB
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(196, 54, 54, 40);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(196, 42, 92, 12);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('🚨 BREAKDOWN HAZARD (95%)', 199, 51);
        }

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
  }, [feedMode, node.id, activeHazard]);

  const handleReportIncident = () => {
    setIsReporting(true);
    const title = activeHazard === 'pothole'
      ? `AI Detected Pothole Distress - CCTV_${node.id.toUpperCase()}`
      : `AI Detected Vehicle Breakdown - CCTV_${node.id.toUpperCase()}`;
    const description = activeHazard === 'pothole'
      ? `Automated computer vision edge detection logged a large pothole distress in lane 2. Location coordinates: (${node.lat.toFixed(4)}, ${node.lon.toFixed(4)}).`
      : `Automated computer vision edge detection logged a stalled vehicle with flashing hazard lights blocking active traffic lanes. Coordinates: (${node.lat.toFixed(4)}, ${node.lon.toFixed(4)}).`;
    const category = activeHazard === 'pothole' ? 'Roads & Bridges' : 'Traffic Anomaly';

    const canvas = canvasRef.current;
    const snapUrl = canvas ? canvas.toDataURL("image/png") : null;

    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        priority: 'High',
        description,
        image: snapUrl
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsReporting(false);
        setActiveHazard(null);
        const logMsg = `[Edge Vision] Ingested automated incident report from CCTV camera node. ID: ${data.id}. Priority: HIGH.`;
        window.dispatchEvent(new CustomEvent('civicmind_log', { detail: logMsg }));
      })
      .catch(err => {
        console.error("Auto reporting failed:", err);
        setIsReporting(false);
      });
  };

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
      
      {/* Simulation injection buttons */}
      <div className="flex gap-1.5 mt-1">
        <button 
          onClick={() => setActiveHazard('pothole')}
          className={`flex-1 text-[9px] font-extrabold py-1 px-1.5 rounded-lg border transition-all ${
            activeHazard === 'pothole'
              ? 'bg-amber-600 border-amber-600 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350'
          }`}
          style={{ cursor: 'pointer' }}
        >
          ⚠️ Inject Pothole
        </button>
        <button 
          onClick={() => setActiveHazard('breakdown')}
          className={`flex-1 text-[9px] font-extrabold py-1 px-1.5 rounded-lg border transition-all ${
            activeHazard === 'breakdown'
              ? 'bg-amber-600 border-amber-600 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350'
          }`}
          style={{ cursor: 'pointer' }}
        >
          🚗 Inject Breakdown
        </button>
        <button 
          onClick={() => setActiveHazard(null)}
          className="text-[9px] font-extrabold py-1 px-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
          style={{ cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>

      {/* Auto ingest prompt */}
      {activeHazard && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-1 flex flex-col gap-2 animate-scale-in">
          <div className="flex items-start gap-2">
            <span className="text-xs">🚨</span>
            <div>
              <h5 className="text-[10px] font-black text-red-500 uppercase tracking-wide">Edge Inference Spot Warning</h5>
              <p className="text-[9px] text-slate-650 dark:text-slate-350 leading-normal mt-0.5">
                {activeHazard === 'pothole'
                  ? 'Road surface distress detected. Risk of tire blowout.'
                  : 'Stalled vehicle in active lanes. Risk of traffic backlog.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleReportIncident}
            disabled={isReporting}
            className="w-full text-center py-1.5 bg-red-650 hover:bg-red-700 text-white font-extrabold text-[9px] uppercase tracking-wide rounded-lg transition-all shadow-[0_0_10px_rgba(220,38,38,0.2)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isReporting ? 'Reporting Distress...' : '🚨 Auto-Ingest Incident'}
          </button>
        </div>
      )}
      
      <div className="flex gap-2 justify-between mt-1">
        <button 
          onClick={() => setFeedMode('ai')} 
          className={`flex-1 text-[10px] font-extrabold py-1.5 px-2 rounded-lg border transition-all ${
            feedMode === 'ai' 
              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/30 dark:text-emerald-400'
              : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-355 dark:hover:bg-slate-800'
          }`}
          style={{ cursor: 'pointer' }}
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
          style={{ cursor: 'pointer' }}
        >
          🔥 Thermal Heatmap
        </button>
      </div>
    </div>
  );
}

export default function DigitalTwin({ 
  onSelectNode, 
  activeIncident, 
  nodesList = [], 
  activeTickets = [], 
  onEmergencyDispatch, 
  bikepointsList = [], 
  cityInfo,
  dispatchedEmergency,
  onClearDispatch,
  userRole
}) {
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

  const [vehicles, setVehicles] = useState([]);
  const routeLineRef = useRef(null);
  const rerouteLineRef = useRef(null);
  const [barricades, setBarricades] = useState([]);
  const [isDrawingBarrier, setIsDrawingBarrier] = useState(false);
  const barricadeLayersRef = useRef({});

  // Style injector for map dash animations and pulsing rings
  useEffect(() => {
    const styleId = 'map-animation-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes map-dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .animate-dash {
          stroke-dasharray: 8, 8;
          animation: map-dash 1.2s linear infinite !important;
        }
        @keyframes pulse-ring {
          0% {
            stroke-opacity: 0.8;
            fill-opacity: 0.15;
            transform: scale(0.9);
          }
          100% {
            stroke-opacity: 0;
            fill-opacity: 0;
            transform: scale(1.3);
          }
        }
        .sensor-pulse-ring {
          transform-origin: center;
          animation: pulse-ring 2.5s ease-out infinite !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // 1. Simulate standard moving vehicles
  useEffect(() => {
    if (!cityInfo) return;
    const baseLat = cityInfo.lat;
    const baseLng = cityInfo.lng;

    const initialVehicles = [
      { id: 'v-garbage', name: 'WasteNet Collect Truck #3', type: 'waste', lat: baseLat + 0.003, lon: baseLng - 0.004, speed: 0.0001, heading: Math.random() * 360, color: '#10b981', symbol: '🚚' },
      { id: 'v-ambulance', name: 'Ambulance Unit A-12', type: 'ambulance', lat: baseLat - 0.004, lon: baseLng + 0.003, speed: 0.00015, heading: Math.random() * 360, color: '#ef4444', symbol: '🚑' },
      { id: 'v-pwd', name: 'PWD Repair Crew', type: 'road', lat: baseLat + 0.002, lon: baseLng + 0.005, speed: 0.00008, heading: Math.random() * 360, color: '#f59e0b', symbol: '🚧' }
    ];
    setVehicles(initialVehicles);

    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.id === 'v-dispatched-unit') return v; // Skip updating dispatcher here
        const rad = v.heading * Math.PI / 180;
        let newLat = v.lat + Math.sin(rad) * v.speed;
        let newLon = v.lon + Math.cos(rad) * v.speed;

        if (Math.abs(newLat - baseLat) > 0.015 || Math.abs(newLon - baseLng) > 0.015) {
          const newHeading = (v.heading + 180 + (Math.random() - 0.5) * 60) % 360;
          return { ...v, heading: newHeading };
        }
        return { ...v, lat: newLat, lon: newLon };
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [cityInfo]);

  // 2. Dispatch routing responder vehicle with dynamic barricade detours
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L || !dispatchedEmergency || !cityInfo) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
    }

    const startPoint = [cityInfo.lat - 0.005, cityInfo.lng + 0.005];
    const endPoint = [dispatchedEmergency.lat, dispatchedEmergency.lon];

    let routeCoords = [startPoint, endPoint];
    let collidingBarricade = null;
    let minDistance = Infinity;

    barricades.forEach(barr => {
      const x1 = startPoint[1], y1 = startPoint[0];
      const x2 = endPoint[1], y2 = endPoint[0];
      const bx = barr.lng, by = barr.lat;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const L2 = dx*dx + dy*dy;
      if (L2 > 0) {
        let t_proj = ((bx - x1)*dx + (by - y1)*dy) / L2;
        t_proj = Math.max(0, Math.min(1, t_proj));
        const nx = x1 + t_proj*dx;
        const ny = y1 + t_proj*dy;
        const dist = Math.sqrt((bx - nx)*(bx - nx) + (by - ny)*(by - ny));
        if (dist < 0.004 && dist < minDistance) {
          minDistance = dist;
          collidingBarricade = barr;
        }
      }
    });

    let detourPoint = null;
    if (collidingBarricade) {
      const x1 = startPoint[1], y1 = startPoint[0];
      const x2 = endPoint[1], y2 = endPoint[0];
      const bx = collidingBarricade.lng, by = collidingBarricade.lat;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx*dx + dy*dy);
      if (length > 0) {
        let px = -dy / length;
        let py = dx / length;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dot = (bx - mx)*px + (by - my)*py;
        const direction = dot > 0 ? -1 : 1;
        detourPoint = [
          my + py * 0.006 * direction,
          mx + px * 0.006 * direction
        ];
        routeCoords = [startPoint, detourPoint, endPoint];
      }
    }

    const polyline = window.L.polyline(routeCoords, {
      color: '#f43f5e',
      weight: 4.5,
      opacity: 0.9,
      className: 'animate-dash'
    }).addTo(map);

    routeLineRef.current = polyline;
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    let progress = 0;
    const stepCount = 40;
    const interval = setInterval(() => {
      progress += 1;
      const t = progress / stepCount;
      let curLat, curLng;

      if (detourPoint) {
        if (progress <= 20) {
          const t_seg = progress / 20;
          curLat = startPoint[0] + (detourPoint[0] - startPoint[0]) * t_seg;
          curLng = startPoint[1] + (detourPoint[1] - startPoint[1]) * t_seg;
        } else {
          const t_seg = (progress - 20) / 20;
          curLat = detourPoint[0] + (endPoint[0] - detourPoint[0]) * t_seg;
          curLng = detourPoint[1] + (endPoint[1] - detourPoint[1]) * t_seg;
        }
      } else {
        curLat = startPoint[0] + (endPoint[0] - startPoint[0]) * t;
        curLng = startPoint[1] + (endPoint[1] - startPoint[1]) * t;
      }

      setVehicles(prev => {
        const idx = prev.findIndex(v => v.id === 'v-dispatched-unit');
        const unit = {
          id: 'v-dispatched-unit',
          name: `Emergency Dispatcher (Responding to ${dispatchedEmergency.title})`,
          type: 'dispatch',
          lat: curLat,
          lon: curLng,
          color: '#f43f5e',
          symbol: '🚒',
          heading: 0
        };
        if (idx === -1) return [...prev, unit];
        const updated = [...prev];
        updated[idx] = unit;
        return updated;
      });

      if (progress >= stepCount) {
        clearInterval(interval);
        setTimeout(() => {
          if (routeLineRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(routeLineRef.current);
            routeLineRef.current = null;
          }
          setVehicles(prev => prev.filter(v => v.id !== 'v-dispatched-unit'));
          if (onClearDispatch) onClearDispatch();
        }, 8000);
      }
    }, 120);

    return () => {
      clearInterval(interval);
    };
  }, [dispatchedEmergency, cityInfo]);

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

  // Fetch emergency services when cityInfo changes
  useEffect(() => {
    const params = cityInfo
      ? `?lat=${cityInfo.lat}&lng=${cityInfo.lng}`
      : '';
    fetch(`/api/emergency/services${params}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmergencyServices(data);
        }
      })
      .catch(err => console.error("Failed to load emergency services:", err));
  }, [cityInfo]);

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
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    const onMapClick = (e) => {
      if (isDrawingBarrier) {
        const newBarricade = {
          id: `barricade-${Date.now()}`,
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          city: cityInfo?.label || 'Mumbai'
        };
        setBarricades(prev => [...prev, newBarricade]);
        setIsDrawingBarrier(false);
        const logMsg = `[Map Authority] Road closure barricade established at coordinates (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}). Recalculating detour routes...`;
        window.dispatchEvent(new CustomEvent('civicmind_log', { detail: logMsg }));
      }
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [isDrawingBarrier, cityInfo]);

  // Draw and update road block barricades on the Leaflet map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    // Clear old barricades
    Object.keys(barricadeLayersRef.current).forEach(id => {
      const layerGroup = barricadeLayersRef.current[id];
      if (layerGroup) {
        map.removeLayer(layerGroup.marker);
        map.removeLayer(layerGroup.circle);
      }
    });
    barricadeLayersRef.current = {};

    const activeCityBarriers = barricades.filter(b => b.city === (cityInfo?.label || 'Mumbai'));

    activeCityBarriers.forEach(barr => {
      const iconHtml = `
        <div style="
          background-color: #f59e0b;
          border: 2px solid #000000;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
        ">🚧</div>
      `;

      const customIcon = window.L.divIcon({
        html: iconHtml,
        className: 'custom-barricade-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = window.L.marker([barr.lat, barr.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div class="map-marker-popup font-mono text-[10px]">
          <strong style="color: #d97706">🚧 ACTIVE ROAD CLOSURE</strong><br/>
          <span>Coordinates: ${barr.lat.toFixed(4)}, ${barr.lng.toFixed(4)}</span><br/>
          <button 
            id="btn-remove-${barr.id}"
            style="margin-top: 6px; padding: 2px 6px; font-size: 9px; font-weight: bold; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Remove Barrier
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-remove-${barr.id}`);
        if (btn) {
          btn.onclick = () => {
            map.closePopup();
            setBarricades(prev => prev.filter(b => b.id !== barr.id));
            const logMsg = `[Map Authority] Barricade removed. Restoring normal route lines.`;
            window.dispatchEvent(new CustomEvent('civicmind_log', { detail: logMsg }));
          };
        }
      });

      const circle = window.L.circle([barr.lat, barr.lng], {
        radius: 400,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.1,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(map);

      barricadeLayersRef.current[barr.id] = { marker, circle };
    });

    return () => {
      Object.keys(barricadeLayersRef.current).forEach(id => {
        const layerGroup = barricadeLayersRef.current[id];
        if (layerGroup) {
          map.removeLayer(layerGroup.marker);
          map.removeLayer(layerGroup.circle);
        }
      });
    };
  }, [barricades, cityInfo]);

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
  }, [nodes, emergencyServices, activeLayers, bikepointsList, heatmapData, vehicles]);

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

    // 5. Add animated simulated vehicles
    vehicles.forEach(veh => {
      const iconHtml = `
        <div style="
          background-color: ${veh.color};
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px ${veh.color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        " class="animate-bounce-subtle">
          ${veh.symbol}
        </div>
      `;

      const customIcon = window.L.divIcon({
        html: iconHtml,
        className: 'custom-vehicle-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = window.L.marker([veh.lat, veh.lon], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          setSelectedNode({
            id: veh.id,
            type: 'vehicle',
            name: veh.name,
            status: 'Moving',
            metric: `GPS Active. Tracking municipal fleet unit.`,
            lat: veh.lat,
            lon: veh.lon,
            color: veh.color
          });
        });

      marker.bindPopup(`
        <div class="map-marker-popup">
          <strong style="color: ${veh.color}">${veh.name}</strong><br/>
          <span style="font-size: 11px; color: #475569">Status: GPS Active | Tracking</span>
        </div>
      `);

      markersRef.current[veh.id] = marker;
    });

    // 6. Add pulsing circle rings around critical/congested IoT nodes
    currentNodes.forEach(node => {
      if (!activeLayers[node.type]) return;
      if (node.status === 'Congested' || node.status === 'Critical') {
        const circle = window.L.circle([node.lat, node.lon], {
          radius: 140, // in meters
          color: node.color,
          fillColor: node.color,
          fillOpacity: 0.08,
          weight: 1.5,
          className: 'sensor-pulse-ring'
        }).addTo(map);
        
        markersRef.current[`ring-${node.id}`] = circle;
      }
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

  const handleReroute = (node) => {
    if (!cityInfo || !window.L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (rerouteLineRef.current) {
      map.removeLayer(rerouteLineRef.current);
      rerouteLineRef.current = null;
    }

    const startPoint = [cityInfo.lat - 0.006, cityInfo.lng - 0.006];
    const congestedPoint = [node.lat, node.lon];
    const endPoint = [cityInfo.lat + 0.006, cityInfo.lng + 0.006];
    const detourPoint = [congestedPoint[0] + 0.003, congestedPoint[1] - 0.003];

    const polyline = window.L.polyline([startPoint, detourPoint, endPoint], {
      color: '#06b6d4',
      weight: 5,
      opacity: 0.95,
      className: 'animate-dash'
    }).addTo(map);

    rerouteLineRef.current = polyline;
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    let step = 0;
    const stepCount = 50;
    setVehicles(prev => prev.filter(v => v.id !== 'v-rerouted-unit'));

    const interval = setInterval(() => {
      step += 1;
      const t = step / stepCount;
      let curLat, curLng;
      
      if (t < 0.5) {
        const tSeg = t * 2;
        curLat = startPoint[0] + (detourPoint[0] - startPoint[0]) * tSeg;
        curLng = startPoint[1] + (detourPoint[1] - startPoint[1]) * tSeg;
      } else {
        const tSeg = (t - 0.5) * 2;
        curLat = detourPoint[0] + (endPoint[0] - detourPoint[0]) * tSeg;
        curLng = detourPoint[1] + (endPoint[1] - detourPoint[1]) * tSeg;
      }

      setVehicles(prev => {
        const idx = prev.findIndex(v => v.id === 'v-rerouted-unit');
        const unit = {
          id: 'v-rerouted-unit',
          name: `Rerouted Commuter Flow (Bypassing ${node.name})`,
          type: 'rerouted',
          lat: curLat,
          lon: curLng,
          color: '#06b6d4',
          symbol: '🔀',
          heading: 0
        };
        if (idx === -1) return [...prev, unit];
        const updated = [...prev];
        updated[idx] = unit;
        return updated;
      });

      if (step >= stepCount) {
        clearInterval(interval);
        setTimeout(() => {
          if (rerouteLineRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(rerouteLineRef.current);
            rerouteLineRef.current = null;
          }
          setVehicles(prev => prev.filter(v => v.id !== 'v-rerouted-unit'));
        }, 8000);
      }
    }, 100);
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
          {userRole === 'admin' && (
            <button
              onClick={() => setIsDrawingBarrier(!isDrawingBarrier)}
              className={`btn flex items-center gap-1.5 py-1 px-3 text-xs rounded-full border transition-all ${
                isDrawingBarrier 
                  ? 'bg-amber-600 border-amber-500 text-white animate-pulse'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-405 hover:bg-amber-500/20'
              }`}
              style={{ cursor: 'pointer' }}
              title="Click on the map to place a road closure barrier"
            >
              <span>🚧 {isDrawingBarrier ? 'Place Barrier...' : 'Block Road'}</span>
            </button>
          )}
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
                {userRole === 'admin' ? (
                  activeTickets.filter(t => t.status !== 'Resolved').length === 0 ? (
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
                  )
                ) : (
                  <p className="text-[10px] text-slate-450 italic">🔒 Dispatch operations reserved for administrators.</p>
                )}
              </div>
            )}

            {['Congested', 'Critical', 'Active'].includes(selectedNode.status) && selectedNode.type !== 'emergency' && (
              userRole === 'admin' ? (
                <div className="flex flex-col gap-2 mt-3">
                  <button
                    onClick={() => handleDispatch(selectedNode)}
                    className="btn-3d btn-primary text-xs w-full flex items-center justify-center gap-1.5"
                    style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                  >
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>Dispatch Resolution Team</span>
                  </button>
                  <button
                    onClick={() => handleReroute(selectedNode)}
                    className="btn-3d btn-secondary text-xs w-full flex items-center justify-center gap-1.5"
                    style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.3)' }}
                  >
                    <span>🔀 Simulate Route Rerouting</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-850 rounded border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 text-center font-medium">
                  🔒 Dispatch and Rerouting controls are locked. Log in as Admin to access.
                </div>
              )
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
