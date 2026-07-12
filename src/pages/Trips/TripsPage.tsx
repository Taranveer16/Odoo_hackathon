import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, Search, MapPin, Navigation,
  Truck, User, Package, Clock, CheckCircle2, AlertTriangle,
  Zap, X, GripVertical, ArrowRight, Activity, Radio,
  Filter, Maximize2, Minimize2, ZoomIn, ZoomOut, Phone,
  ChevronRight, Flag, Circle, Loader2, Eye
} from 'lucide-react';
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip, markCheckpoint } from '../../services/tripService';
import { getVehicles } from '../../services/vehicleService';
import { getDrivers } from '../../services/driverService';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import type { Trip, Vehicle, Driver, TripLifecycleStatus, TripPriority, CargoVerification, Checkpoint } from '../../types';

// ─── Lifecycle helpers ─────────────────────────────────────
const LIFECYCLE_STEPS: { key: TripLifecycleStatus; label: string }[] = [
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'departed', label: 'Departed' },
  { key: 'en_route', label: 'En Route' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_COLORS: Record<string, string> = {
  delivered:        'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  trip_closed:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  in_transit:       'text-amber-400 bg-amber-400/10 border-amber-400/30',
  en_route:         'text-amber-400 bg-amber-400/10 border-amber-400/30',
  at_checkpoint:    'text-amber-400 bg-amber-400/10 border-amber-400/30',
  dispatched:       'text-blue-400 bg-blue-400/10 border-blue-400/30',
  departed:         'text-blue-400 bg-blue-400/10 border-blue-400/30',
  out_for_delivery: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  delayed:          'text-red-400 bg-red-400/10 border-red-400/30',
  cancelled:        'text-red-400 bg-red-400/10 border-red-400/30',
  waiting:          'text-orange-400 bg-orange-400/10 border-orange-400/30',
  draft:            'text-slate-400 bg-slate-400/10 border-slate-400/30',
};

const PRIORITY_BADGE: Record<TripPriority, string> = {
  urgent: 'text-red-400 bg-red-400/15 border-red-400/40',
  high:   'text-orange-400 bg-orange-400/15 border-orange-400/40',
  normal: 'text-blue-400 bg-blue-400/15 border-blue-400/40',
  low:    'text-slate-400 bg-slate-400/15 border-slate-400/40',
};

function humanStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStepIndex(status: TripLifecycleStatus): number {
  const map: Partial<Record<TripLifecycleStatus, number>> = {
    dispatched: 0, departed: 1, en_route: 2, at_checkpoint: 2,
    loading: 2, unloading: 2, waiting: 2, delayed: 2,
    in_transit: 3, out_for_delivery: 4, delivered: 5, trip_closed: 5,
  };
  return map[status] ?? -1;
}

// ─── Clean Flat Truck Icon (side-view SVG) ────────────────
function TruckSideView({ size = 48, color = '#f59e0b' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 80 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cargo box */}
      <rect x="2" y="6" width="46" height="28" rx="3" fill={color} />
      {/* Cab */}
      <path d="M48 18 L60 14 L66 22 L66 34 L48 34 Z" fill={color} />
      {/* Windshield */}
      <path d="M50 18.5 L59 15.5 L63 21 L63 26 L50 26 Z" fill="#0d0d12" opacity="0.7" />
      <path d="M51 19 L58 16.5 L61.5 21 L61.5 25 L51 25 Z" fill="#38bdf8" opacity="0.3" />
      {/* Door */}
      <rect x="32" y="10" width="14" height="18" rx="1.5" fill="#0d0d12" opacity="0.15" />
      {/* Brand stripe */}
      <rect x="2" y="19" width="46" height="4" rx="0" fill="white" opacity="0.12" />
      {/* Chassis */}
      <rect x="2" y="34" width="64" height="3" rx="1" fill="#1e1b30" />
      {/* Rear wheel */}
      <circle cx="16" cy="38" r="6" fill="#1e1b30" />
      <circle cx="16" cy="38" r="3.5" fill="#4a4560" />
      <circle cx="16" cy="38" r="1.5" fill="#9ca3af" />
      {/* Front wheel */}
      <circle cx="56" cy="38" r="6" fill="#1e1b30" />
      <circle cx="56" cy="38" r="3.5" fill="#4a4560" />
      <circle cx="56" cy="38" r="1.5" fill="#9ca3af" />
      {/* Headlight */}
      <rect x="63" y="28" width="3" height="4" rx="1" fill="#fef08a" />
      {/* Rear light */}
      <rect x="2" y="24" width="2.5" height="6" rx="1" fill="#ef4444" />
      {/* Logo text */}
      <text x="10" y="27" fill="white" fontSize="6.5" fontWeight="800" opacity="0.7" fontFamily="system-ui">TransitOps</text>
    </svg>
  );
}

// ─── Schematic Route Diagram ─────────────────────────────
interface AnimatedMapProps {
  trip: Trip;
  fullScreen?: boolean;
}

function SchematicRouteMap({ trip, fullScreen = false }: AnimatedMapProps) {
  const [zoom, setZoom] = useState(1);

  const stops = [
    { label: trip.source.split(',')[0], location: trip.source, isVisited: true, isCurrent: false, type: 'origin' as const },
    ...trip.checkpoints.map((cp) => ({
      label: (cp.label || cp.location).replace(/Checkpoint \d+ \((.+)\)/, '$1').split(',')[0],
      location: cp.location,
      isVisited: cp.status === 'completed' || cp.status === 'departed',
      isCurrent: cp.status === 'arrived' || cp.status === 'loading' || cp.status === 'unloading' || cp.status === 'en_route' || cp.status === 'waiting',
      type: 'checkpoint' as const,
      cpStatus: cp.status,
    })),
    { label: trip.destination.split(',')[0], location: trip.destination, isVisited: trip.status === 'delivered' || trip.status === 'trip_closed', isCurrent: false, type: 'destination' as const },
  ];

  const totalStops = stops.length;
  const startX = 60;
  const endX = 740;
  const stepX = (endX - startX) / Math.max(totalStops - 1, 1);
  const trackY = 140;

  const progressPercent = trip.progressPercent ?? 0;
  const truckX = startX + (progressPercent / 100) * (endX - startX);

  return (
    <div className={`relative w-full bg-[#0a0a10] border border-white/6 rounded-2xl overflow-hidden transition-all duration-300 ${
      fullScreen ? 'h-[calc(100vh-200px)]' : 'h-60'
    }`}>
      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Zoom controls */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
          className="w-7 h-7 rounded-lg bg-white/6 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/8">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
          className="w-7 h-7 rounded-lg bg-white/6 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/8">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-full h-full overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{ scale: zoom }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="w-[800px] h-full relative origin-center"
        >
          <svg className="w-full h-full" viewBox="0 0 800 280">
            {/* Base track */}
            <line x1={startX} y1={trackY} x2={endX} y2={trackY} stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />

            {/* Completed amber track */}
            <line
              x1={startX} y1={trackY} x2={truckX} y2={trackY}
              stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
            />

            {/* Nodes */}
            {stops.map((stop, i) => {
              const nodeX = startX + i * stepX;
              const isAbove = i % 2 === 0;
              const labelY = isAbove ? trackY - 55 : trackY + 55;
              const lineY1 = isAbove ? trackY - 14 : trackY + 14;
              const lineY2 = isAbove ? trackY - 42 : trackY + 42;

              const fillColor = stop.isVisited
                ? '#10b981'
                : stop.isCurrent
                ? 'var(--accent)'
                : '#1e293b';

              const strokeColor = stop.isVisited
                ? '#10b981'
                : stop.isCurrent
                ? 'var(--accent)'
                : 'rgba(255,255,255,0.15)';

              return (
                <g key={i}>
                  {/* connector line */}
                  <line x1={nodeX} y1={lineY1} x2={nodeX} y2={lineY2}
                    stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* outer halo for current */}
                  {stop.isCurrent && (
                    <circle cx={nodeX} cy={trackY} r="16"
                      fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.4)" strokeWidth="1"
                      className="animate-pulse" />
                  )}

                  {/* node circle */}
                  <circle cx={nodeX} cy={trackY} r={stop.isCurrent ? 9 : stop.isVisited ? 8 : 7}
                    fill={fillColor} stroke={strokeColor} strokeWidth="2" />

                  {/* checkmark for visited */}
                  {stop.isVisited && (
                    <path d={`M ${nodeX - 3} ${trackY} L ${nodeX - 0.5} ${trackY + 2.5} L ${nodeX + 4} ${trackY - 3}`}
                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  )}

                  {/* label badge */}
                  <g transform={`translate(${nodeX}, ${labelY})`}>
                    <rect x="-48" y="-14" width="96" height="28" rx="7"
                      fill={stop.isCurrent ? 'rgba(245,158,11,0.15)' : 'rgba(15,15,25,0.92)'}
                      stroke={stop.isCurrent ? 'rgba(245,158,11,0.5)' : stop.isVisited ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}
                      strokeWidth="1" />

                    {/* type icon dot */}
                    <circle cx="-36" cy="0" r="3"
                      fill={stop.type === 'origin' ? '#f59e0b' : stop.type === 'destination' ? '#8b5cf6' : stop.isVisited ? '#10b981' : 'rgba(255,255,255,0.3)'} />

                    <text x="-26" y="-3" fill={stop.isCurrent ? '#f59e0b' : stop.isVisited ? '#d1fae5' : 'rgba(255,255,255,0.85)'}
                      fontSize="9.5" fontWeight="700" textAnchor="start" fontFamily="system-ui">
                      {stop.label.length > 11 ? stop.label.slice(0, 11) + '…' : stop.label}
                    </text>
                    <text x="-26" y="9" fill="rgba(148,163,184,0.7)" fontSize="7.5" textAnchor="start" fontFamily="system-ui">
                      {stop.type === 'origin' ? 'Origin' : stop.type === 'destination' ? 'Dest.' : 'Checkpoint'}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Truck indicator */}
            {trip.status !== 'delivered' && trip.status !== 'draft' && (
              <g transform={`translate(${truckX}, ${trackY - 32})`}>
                {/* ping ring */}
                <circle cx="0" cy="0" r="20" fill="rgba(245,158,11,0.07)" stroke="rgba(245,158,11,0.25)" strokeWidth="1" className="animate-ping" style={{ transformOrigin: '0px 0px' }} />
                {/* bg circle */}
                <circle cx="0" cy="0" r="14" fill="#0d0d18" stroke="var(--accent)" strokeWidth="1.5"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' }} />
                {/* truck icon simplified */}
                <g transform="translate(-7, -5)">
                  {/* box */}
                  <rect x="0" y="1" width="9" height="7" rx="1" fill="var(--accent)" />
                  {/* cab */}
                  <path d="M9 3.5 L13 3 L14 5.5 L14 8 L9 8 Z" fill="var(--accent)" />
                  {/* wheels */}
                  <circle cx="3" cy="9.5" r="1.5" fill="#1e293b" stroke="var(--accent)" strokeWidth="0.8" />
                  <circle cx="11" cy="9.5" r="1.5" fill="#1e293b" stroke="var(--accent)" strokeWidth="0.8" />
                </g>
                {/* progress text */}
                <text x="0" y="28" fill="var(--accent)" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="system-ui">{progressPercent}%</text>
              </g>
            )}

            {/* destination flag for delivered */}
            {(trip.status === 'delivered' || trip.status === 'trip_closed') && (
              <g transform={`translate(${endX}, ${trackY - 36})`}>
                <circle cx="0" cy="0" r="14" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1.5" />
                <text x="0" y="5" fontSize="12" textAnchor="middle">✓</text>
              </g>
            )}
          </svg>
        </motion.div>
      </div>

      {/* Info bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 bg-gradient-to-t from-[#0d0d18] via-[#0d0d18]/80 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-accent/15 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-accent animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white">{trip.source.split(',')[0]} <span className="text-accent">→</span> {trip.destination.split(',')[0]}</p>
            <p className="text-[9px] text-slate-500">{trip.currentLocation || 'Awaiting dispatch'}</p>
          </div>
        </div>
        {trip.eta && (
          <div className="text-right">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">ETA</p>
            <p className="text-xs font-black text-accent">{new Date(trip.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lifecycle Stepper ───────────────────────────────────
function LifecycleStepper({ trip }: { trip: Trip }) {
  const stepIdx = getStepIndex(trip.status);

  return (
    <div className="flex items-center overflow-x-auto">
      {LIFECYCLE_STEPS.map((step, i) => {
        const isActive = i === stepIdx;
        const isDone = i < stepIdx;
        return (
          <div key={step.key} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                isDone  ? 'border-emerald-500 bg-emerald-500 text-white' :
                isActive ? 'border-accent bg-accent/20 text-accent shadow-lg shadow-accent/30' :
                'border-white/10 bg-white/3 text-slate-600'
              }`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                 isActive ? <Truck className="w-3 h-3 animate-pulse" /> :
                 <span className="text-[9px] font-black">{i + 1}</span>}
              </div>
              <span className={`text-[8px] font-black whitespace-nowrap ${
                isActive ? 'text-accent' : isDone ? 'text-emerald-400' : 'text-slate-600'
              }`}>{step.label}</span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div className={`w-10 h-0.5 mx-1 rounded-full mb-4 transition-all duration-500 ${
                i < stepIdx ? 'bg-emerald-500/40' : 'bg-white/5'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Checkpoint Step-by-Step Panel ───────────────────────
interface CheckpointPanelProps {
  trip: Trip;
  onMarkCheckpoint: (tripId: string, cpId: string) => void;
  isLoading?: boolean;
  verifications?: CargoVerification[];
  canEdit?: boolean;
}

function CheckpointPanel({ trip, onMarkCheckpoint, isLoading, verifications = [], canEdit = true }: CheckpointPanelProps) {
  const allStops = [
    { id: 'origin', label: trip.source.split(',')[0], location: trip.source, status: 'completed' as const, type: 'origin', assignedCcoName: '', verificationStatus: 'not_required' },
    ...trip.checkpoints.map(cp => ({ ...cp, label: cp.label || cp.location, type: 'checkpoint' as const })),
    { id: 'dest', label: trip.destination.split(',')[0], location: trip.destination, status: trip.status === 'delivered' ? 'completed' as const : 'pending' as const, type: 'destination' as const, assignedCcoName: '', verificationStatus: 'not_required' },
  ];

  const canMark = (status: string) =>
    ['pending', 'en_route', 'arrived', 'loading', 'unloading', 'waiting'].includes(status);

  const getMarkLabel = (status: string) => {
    if (status === 'arrived' || status === 'loading' || status === 'unloading' || status === 'waiting') return 'Depart Checkpoint';
    return 'Mark Arrived';
  };

  const dotColor = (status: string, vStatus?: string) => {
    if (vStatus === 'rejected') return 'bg-red-500 border-red-500';
    if (status === 'completed' || status === 'departed' || vStatus === 'approved') return 'bg-emerald-500 border-emerald-500';
    if (status === 'arrived' || status === 'loading' || status === 'unloading' || status === 'waiting' || status === 'awaiting_verification') return 'bg-amber-500/30 border-amber-500 shadow-amber-500/30 shadow-lg';
    if (status === 'en_route') return 'bg-blue-500/30 border-blue-500';
    return 'bg-white/5 border-white/15';
  };

  return (
    <div className="relative pl-2 space-y-1">
      {/* vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-emerald-500/30 via-accent/20 to-white/5" />

      {allStops.map((stop, i) => {
        const isOriginalCp = stop.type === 'checkpoint';
        const checkpointVerification = isOriginalCp ? verifications.find(v => v.checkpointId === stop.id) : null;
        const vStatus = checkpointVerification ? checkpointVerification.status : (stop.verificationStatus || 'pending');

        const isDone = stop.status === 'completed' || stop.status === 'departed' || vStatus === 'approved';
        const isCurrent = ['arrived', 'loading', 'unloading', 'waiting', 'en_route', 'awaiting_verification'].includes(stop.status) && vStatus !== 'approved';

        return (
          <div key={stop.id} className={`flex flex-col gap-1 py-2.5 px-2.5 rounded-xl transition-colors ${isCurrent ? 'bg-amber-500/5 border border-amber-500/15' : 'hover:bg-white/2'}`}>
            <div className="flex items-start gap-3">
              {/* dot */}
              <div className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${dotColor(stop.status, vStatus)}`}>
                {isDone ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {stop.type === 'origin' && <Flag className="w-3 h-3 text-amber-400" />}
                      {stop.type === 'destination' && <Flag className="w-3 h-3 text-purple-400" />}
                      {stop.type === 'checkpoint' && <Circle className="w-2.5 h-2.5 text-slate-500" />}
                      <p className={`text-xs font-bold ${isDone ? 'text-slate-300' : isCurrent ? 'text-amber-300' : 'text-slate-500'}`}>
                        {stop.label}
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-600 mt-0.5 pl-4">{stop.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      vStatus === 'approved' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                      vStatus === 'rejected' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                      vStatus === 'in_progress' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                      isCurrent ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' :
                      'text-slate-600 bg-white/3 border-white/8'
                    }`}>
                      {vStatus === 'approved' ? 'Approved ✓' :
                       vStatus === 'rejected' ? 'Rejected ✗' :
                       vStatus === 'in_progress' ? 'Verifying...' :
                       stop.status === 'awaiting_verification' ? 'Awaiting Verification' :
                       humanStatus(stop.status)}
                    </span>
                    {isOriginalCp && canMark(stop.status) && vStatus !== 'approved' && vStatus !== 'rejected' && vStatus !== 'in_progress' && canEdit && (
                      <button
                        onClick={() => onMarkCheckpoint(trip.id, stop.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2.5 py-1 bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent text-[9px] font-black rounded-lg transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                        {getMarkLabel(stop.status)}
                      </button>
                    )}
                  </div>
                </div>

                {isOriginalCp && stop.assignedCcoName && (
                  <p className="text-[9px] text-slate-500 mt-1 pl-4">
                    Assigned Officer: <span className="text-white font-medium">{stop.assignedCcoName}</span>
                  </p>
                )}

                {/* Show verification result summary */}
                {checkpointVerification && (
                  <div className="mt-2 ml-4 p-2 bg-black/20 border border-white/5 rounded-lg space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Verified by: <span className="text-slate-300 font-bold">{checkpointVerification.verifiedByName}</span></span>
                      {checkpointVerification.verifiedAt && (
                        <span>{new Date(checkpointVerification.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    {checkpointVerification.overallNotes && (
                      <p className="text-slate-400 italic">"{checkpointVerification.overallNotes}"</p>
                    )}
                    {/* Discrepancies list */}
                    {checkpointVerification.items.some(item => item.missingQty > 0 || item.damagedQty > 0 || item.removedQty > 0) ? (
                      <div className="pt-1.5 border-t border-white/5 text-[9px] text-red-400 font-semibold space-y-0.5">
                        {checkpointVerification.items.filter(item => item.missingQty > 0 || item.damagedQty > 0 || item.removedQty > 0).map(item => (
                          <div key={item.cargoItemId} className="flex justify-between">
                            <span>⚠ {item.name}:</span>
                            <span>
                              {item.missingQty > 0 && `${item.missingQty} Missing`}
                              {item.damagedQty > 0 && ` ${item.damagedQty} Damaged`}
                              {item.removedQty > 0 && ` ${item.removedQty} Removed`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9px] text-emerald-400 font-semibold pt-1">✓ All cargo items matched expected manifest.</p>
                    )}
                  </div>
                )}

                {'actualArrival' in stop && stop.actualArrival && (
                  <p className="text-[9px] text-slate-600 mt-1 pl-4">
                    Arrived: <span className="text-slate-400">{new Date(stop.actualArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {'actualDeparture' in stop && stop.actualDeparture && (
                      <> · Departed: <span className="text-slate-400">{new Date(stop.actualDeparture as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></>
                    )}
                  </p>
                )}
                {'notes' in stop && stop.notes && !checkpointVerification && (
                  <p className="text-[9px] text-slate-500 mt-0.5 pl-4 italic">"{stop.notes}"</p>
                )}
                {'delayMinutes' in stop && typeof stop.delayMinutes === 'number' && stop.delayMinutes > 0 && (
                  <div className="flex items-center gap-1 mt-1 pl-4">
                    <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                    <span className="text-[9px] text-red-400 font-bold">+{stop.delayMinutes} min delay</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Trip List Card ───────────────────────────────────────
function TripListCard({ trip, isSelected, onClick, vehicleMap, driverMap }: {
  trip: Trip;
  isSelected: boolean;
  onClick: () => void;
  vehicleMap: Record<string, Vehicle>;
  driverMap: Record<string, Driver>;
}) {
  const vehicle = vehicleMap[trip.vehicleId];
  const driver = driverMap[trip.driverId];
  const isActive = !['delivered', 'trip_closed', 'cancelled', 'draft'].includes(trip.status);

  return (
    <motion.button
      layout
      onClick={onClick}
      className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all duration-200 group ${
        isSelected
          ? 'bg-accent/10 border-accent/40 shadow-lg shadow-accent/10'
          : 'bg-white/2 border-white/5 hover:bg-white/4 hover:border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[9px] font-black text-slate-600 shrink-0">{trip.id}</span>
          {trip.priority !== 'normal' && (
            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${PRIORITY_BADGE[trip.priority]} shrink-0`}>
              {trip.priority}
            </span>
          )}
        </div>
        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${STATUS_COLORS[trip.status] ?? 'text-slate-400 bg-white/5 border-white/8'}`}>
          {humanStatus(trip.status)}
        </span>
      </div>

      <p className={`text-xs font-black leading-tight truncate mb-1 ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'} transition-colors`}>
        {trip.source.split(',')[0]} <span className="text-accent/70">→</span> {trip.destination.split(',')[0]}
      </p>

      <div className="flex items-center gap-2 text-[9px] text-slate-600">
        <span className="flex items-center gap-0.5 truncate"><Truck className="w-2.5 h-2.5 shrink-0" />{vehicle?.registrationNumber ?? '—'}</span>
        <span className="flex items-center gap-0.5 truncate"><User className="w-2.5 h-2.5 shrink-0" />{driver?.name.split(' ')[0] ?? '—'}</span>
      </div>

      {isActive && typeof trip.progressPercent === 'number' && (
        <div className="mt-2 w-full bg-white/5 rounded-full h-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${trip.progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full bg-accent"
          />
        </div>
      )}
    </motion.button>
  );
}

// ─── Trip Detail Panel ────────────────────────────────────
interface DetailPanelProps {
  trip: Trip;
  vehicle?: Vehicle;
  driver?: Driver;
  onDispatch: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onMarkCheckpoint: (tripId: string, cpId: string) => void;
  isMarkingCheckpoint?: boolean;
  verifications?: CargoVerification[];
  /** If false, hides all mutation buttons (read-only mode for safety_officer) */
  canEdit?: boolean;
}

function TripDetailPanel({ trip, vehicle, driver, onDispatch, onComplete, onCancel, onMarkCheckpoint, isMarkingCheckpoint, verifications = [], canEdit = true }: DetailPanelProps) {
  const [tab, setTab] = useState<'checkpoints' | 'vehicle'>('checkpoints');
  const [isMapFS, setIsMapFS] = useState(false);

  // Next actionable checkpoint
  const nextCheckpoint = trip.checkpoints.find(cp =>
    ['pending', 'en_route', 'arrived', 'loading', 'unloading', 'waiting'].includes(cp.status)
  );

  return (
    <div className="flex flex-col h-full bg-[#080810] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/5 shrink-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{trip.id}</span>
              {trip.priority !== 'normal' && (
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${PRIORITY_BADGE[trip.priority]}`}>
                  {trip.priority}
                </span>
              )}
            </div>
            <h2 className="text-base font-black text-white leading-tight">
              {trip.source.split(',')[0]} <span className="text-accent">→</span> {trip.destination.split(',')[0]}
            </h2>
            {trip.tripName && <p className="text-[10px] text-slate-500 mt-0.5">{trip.tripName}</p>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[trip.status] ?? 'text-slate-400 bg-white/5 border-white/10'}`}>
              {humanStatus(trip.status)}
            </span>
            <button
              onClick={() => setIsMapFS(!isMapFS)}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all text-slate-500 hover:text-white ${isMapFS ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-white/4 border-white/8'}`}
            >
              {isMapFS ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
          {vehicle && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{vehicle.registrationNumber}</span>}
          {driver && <span className="flex items-center gap-1"><User className="w-3 h-3" />{driver.name}</span>}
          <span className="flex items-center gap-1"><Package className="w-3 h-3" />{trip.cargoWeight.toLocaleString()} kg</span>
          {trip.eta && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />ETA {new Date(trip.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          {trip.clientName && <span className="text-slate-600">{trip.clientName}</span>}
        </div>
      </div>

      {/* Lifecycle Stepper */}
      <div className="px-5 py-3 border-b border-white/5 shrink-0 overflow-x-auto bg-white/1">
        <LifecycleStepper trip={trip} />
      </div>

      {/* Schematic Map */}
      <div className="px-4 py-3 shrink-0">
        <AnimatePresence mode="wait">
          {isMapFS ? (
            <motion.div key="fs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#080810] p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-accent animate-pulse" /> Route Overview
                </span>
                <button onClick={() => setIsMapFS(false)} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5">
                  <Minimize2 className="w-3.5 h-3.5" /> Close
                </button>
              </div>
              <SchematicRouteMap trip={trip} fullScreen />
            </motion.div>
          ) : (
            <motion.div key="normal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SchematicRouteMap trip={trip} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress KPIs */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-2.5 shrink-0">
        {[
          { label: 'Progress', value: `${trip.progressPercent ?? 0}%`, accent: true },
          { label: 'Distance', value: `${trip.plannedDistance} km` },
          { label: 'Cargo', value: trip.cargoType || '—' },
          { label: 'Checkpoints', value: `${trip.checkpoints.filter(c => c.status === 'completed' || c.status === 'departed').length}/${trip.checkpoints.length}` },
        ].map(k => (
          <div key={k.label} className="bg-white/2 border border-white/5 rounded-xl p-2.5">
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`text-sm font-black ${k.accent ? 'text-accent' : 'text-white'}`}>{k.value}</p>
            {k.accent && (
              <div className="mt-1.5 w-full bg-white/5 rounded-full h-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${trip.progressPercent ?? 0}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-accent"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-4 border-t border-white/5 shrink-0">
        <div className="flex gap-0">
          {[
            { key: 'checkpoints', label: '📍 Checkpoints' },
            { key: 'vehicle', label: '🚛 Vehicle' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all ${
                tab === t.key ? 'border-accent text-accent' : 'border-transparent text-slate-600 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        <AnimatePresence mode="wait">
          {tab === 'checkpoints' && (
            <motion.div key="cp" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {trip.checkpoints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-700">
                  <MapPin className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs font-bold">No checkpoints defined</p>
                  <p className="text-[10px] mt-1">Direct route from origin to destination</p>
                </div>
              ) : (
                <CheckpointPanel trip={trip} onMarkCheckpoint={onMarkCheckpoint} isLoading={isMarkingCheckpoint} verifications={verifications} canEdit={canEdit} />
              )}
            </motion.div>
          )}
          {tab === 'vehicle' && (
            <motion.div key="veh" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {vehicle ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 p-3 bg-white/2 rounded-xl border border-white/5">
                    <div className="shrink-0">
                      <TruckSideView size={80} color="#f59e0b" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      {[
                        { l: 'Vehicle No.', v: vehicle.registrationNumber },
                        { l: 'Name', v: vehicle.name },
                        { l: 'Model', v: vehicle.model },
                        { l: 'Max Load', v: `${vehicle.maxLoadCapacity.toLocaleString()} kg` },
                        { l: 'Year', v: vehicle.year?.toString() ?? '—' },
                        { l: 'Fuel', v: vehicle.fuelType ?? '—' },
                      ].map(item => (
                        <div key={item.l}>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-wider">{item.l}</p>
                          <p className="text-xs font-bold text-white mt-0.5">{item.v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {driver && (
                    <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-wider mb-1">Assigned Driver</p>
                        <p className="text-sm font-black text-white">{driver.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{driver.contactNumber} · Safety: {driver.safetyScore}/100</p>
                      </div>
                      <a href={`tel:${driver.contactNumber}`}
                        className="w-9 h-9 rounded-xl bg-white/4 hover:bg-accent/20 hover:text-accent border border-white/8 flex items-center justify-center text-slate-400 transition-colors">
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-600 text-center py-8">No vehicle data</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Footer */}
      <div className="px-4 py-3 border-t border-white/5 flex gap-2 shrink-0 bg-black/10">
        {canEdit ? (
          <>
            {/* Next checkpoint quick-action */}
            {nextCheckpoint && trip.status !== 'draft' && (
              <button
                onClick={() => onMarkCheckpoint(trip.id, nextCheckpoint.id)}
                disabled={isMarkingCheckpoint}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 rounded-xl border border-amber-500/25 transition-all active:scale-95 disabled:opacity-50"
              >
                {isMarkingCheckpoint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {nextCheckpoint.status === 'arrived' || nextCheckpoint.status === 'loading' || nextCheckpoint.status === 'waiting'
                  ? 'Depart Checkpoint' : 'Mark Checkpoint Arrived'}
              </button>
            )}
            {(trip.status === 'ready_for_dispatch' || trip.status === 'draft' || trip.status === 'assigned') && (
              <button onClick={onDispatch} className="flex-1 btn-primary py-2.5 text-xs font-black flex items-center justify-center gap-2">
                <Zap className="w-3.5 h-3.5 stroke-[3]" /> DISPATCH
              </button>
            )}
            {trip.status !== 'delivered' && trip.status !== 'trip_closed' && trip.status !== 'cancelled' && trip.status !== 'draft' && trip.status !== 'ready_for_dispatch' && trip.status !== 'assigned' && (
              <button onClick={onComplete} className="flex-1 py-2.5 text-xs font-black bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-400 rounded-xl border border-emerald-500/25 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> MARK DELIVERED
              </button>
            )}
            {trip.status !== 'cancelled' && trip.status !== 'delivered' && trip.status !== 'trip_closed' && (
              <button onClick={onCancel} className="px-3.5 py-2.5 text-xs font-black bg-red-500/8 hover:bg-red-500/18 text-red-400 rounded-xl border border-red-500/18 transition-all flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-600">
            <Eye className="w-3.5 h-3.5" />
            Read-only mode — Safety Officer View
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Trip Modal ──────────────────────────────────────
interface NewCheckpoint {
  id: string;
  location: string;
}

interface NewCheckpoint {
  id: string;
  location: string;
  warehouseId?: string;
  assignedCcoId?: string;
  assignedCcoName?: string;
}

interface NewCargoItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  category: string;
  barcode?: string;
}

function CreateTripModal({ vehicles, drivers, onClose, onSave }: {
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
  onSave: (data: Partial<Trip>) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    tripName: '', vehicleId: '', driverId: '', source: '', destination: '',
    cargoType: '', cargoWeight: '', clientName: '',
    plannedDistance: '', notes: '', priority: 'normal' as TripPriority,
  });

  const [checkpoints, setCheckpoints] = useState<NewCheckpoint[]>([]);
  const [cargoItems, setCargoItems] = useState<NewCargoItem[]>([
    { id: 'item-1', name: 'Standard Pallets', quantity: 10, weight: 150, category: 'General' }
  ]);

  // Inline Create CCO form state
  const [showAddCco, setShowAddCco] = useState(false);
  const [targetCpId, setTargetCpId] = useState<string | null>(null);
  const [ccoForm, setCcoForm] = useState({
    name: '', email: '', password: 'password123', phone: '', assignedWarehouseId: ''
  });

  // Query warehouses & CCOs
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { getWarehouses } = await import('../../services/warehouseService');
      return getWarehouses();
    }
  });

  const { data: ccos = [], refetch: refetchCcos } = useQuery({
    queryKey: ['ccos'],
    queryFn: async () => {
      const { getCCOs } = await import('../../services/ccoService');
      return getCCOs();
    }
  });

  const addCheckpoint = () => setCheckpoints(c => [...c, { id: `cp-${Date.now()}`, location: '' }]);
  const removeCheckpoint = (id: string) => setCheckpoints(c => c.filter(x => x.id !== id));
  const updateCheckpoint = (id: string, val: string) =>
    setCheckpoints(c => c.map(x => x.id === id ? { ...x, location: val } : x));

  const updateCheckpointCco = (id: string, warehouseId: string, assignedCcoId: string) => {
    const selectedCco = ccos.find(c => c.id === assignedCcoId);
    setCheckpoints(c => c.map(x => x.id === id ? {
      ...x,
      warehouseId,
      assignedCcoId,
      assignedCcoName: selectedCco ? selectedCco.name : ''
    } : x));
  };

  // Cargo Items handlers
  const addCargoItem = () => setCargoItems(items => [...items, {
    id: `item-${Date.now()}`, name: '', quantity: 1, weight: 10, category: 'General'
  }]);
  const removeCargoItem = (id: string) => setCargoItems(items => items.filter(x => x.id !== id));
  const updateCargoItem = (id: string, field: keyof NewCargoItem, val: any) =>
    setCargoItems(items => items.map(x => x.id === id ? { ...x, [field]: val } : x));

  // Inline CCO save
  const handleCreateCco = async () => {
    if (!ccoForm.name || !ccoForm.email || !ccoForm.assignedWarehouseId) {
      toast.error('Missing fields', 'Name, Email, and Assigned Warehouse are required.');
      return;
    }
    try {
      const { createCCO } = await import('../../services/ccoService');
      const newCco = await createCCO({
        name: ccoForm.name,
        email: ccoForm.email,
        phone: ccoForm.phone,
        assignedWarehouseId: ccoForm.assignedWarehouseId
      });
      toast.success('Officer created', `Cargo Control Officer ${newCco.name} created successfully.`);
      await refetchCcos();
      if (targetCpId) {
        updateCheckpointCco(targetCpId, ccoForm.assignedWarehouseId, newCco.id);
      }
      setShowAddCco(false);
      setCcoForm({ name: '', email: '', password: 'password123', phone: '', assignedWarehouseId: '' });
    } catch (err: any) {
      toast.error('Create CCO failed', err.message);
    }
  };

  const handleSubmit = () => {
    if (!form.vehicleId || !form.driverId || !form.source || !form.destination) {
      toast.error('Missing fields', 'Vehicle, driver, source and destination are required.');
      return;
    }

    const calculatedWeight = cargoItems.reduce((acc, curr) => acc + (curr.quantity * curr.weight), 0);

    onSave({
      tripName: form.tripName || `${form.source.split(',')[0]} → ${form.destination.split(',')[0]}`,
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      source: form.source,
      destination: form.destination,
      cargoType: form.cargoType || (cargoItems[0]?.name ?? 'General Freight'),
      cargoWeight: calculatedWeight || parseFloat(form.cargoWeight) || 0,
      clientName: form.clientName,
      plannedDistance: parseFloat(form.plannedDistance) || 0,
      notes: form.notes,
      priority: form.priority,
      cargoManifest: cargoItems.filter(c => c.name).map(c => ({
        id: c.id,
        name: c.name,
        quantity: c.quantity,
        weight: c.weight,
        category: c.category,
        barcode: c.barcode || `BC-${c.name.slice(0,2).toUpperCase()}-${Math.floor(1000 + Math.random()*9000)}`
      })),
      checkpoints: checkpoints.filter(c => c.location).map((c, i) => ({
        id: c.id,
        label: `Checkpoint ${i + 1} (${c.location.split(',')[0]})`,
        location: c.location,
        warehouseId: c.warehouseId,
        assignedCcoId: c.assignedCcoId,
        assignedCcoName: c.assignedCcoName,
        status: 'pending' as const,
        verificationStatus: 'pending' as const,
      })),
      status: 'draft',
      progressPercent: 0,
    });
  };

  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const availableDrivers = drivers.filter(d => d.status === 'available');

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="relative z-10 w-full max-w-lg bg-[#0d0d18] border-l border-white/8 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-base font-black text-white">Create Trip</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Route, vehicle, driver & cargo configuration</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Scroll Container */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Trip Info */}
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Trip Info</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 mb-1 block font-semibold">Trip Name</label>
                <input className="input w-full text-sm" placeholder="e.g. Mumbai → Delhi Run"
                  value={form.tripName} onChange={e => setForm(f => ({ ...f, tripName: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block font-semibold">Priority</label>
                <select className="input w-full text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TripPriority }))}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block font-semibold">Client Name</label>
                <input className="input w-full text-sm" placeholder="Acme Corp"
                  value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Assignment</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block font-semibold">Vehicle *</label>
                <select className="input w-full text-sm" value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}>
                  <option value="">— Select —</option>
                  {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} · {v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block font-semibold">Driver *</label>
                <select className="input w-full text-sm" value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))}>
                  <option value="">— Select —</option>
                  {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.safetyScore})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Route Builder */}
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Route & Checkpoint Assignment</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center shrink-0">
                  <MapPin className="w-3 h-3 text-amber-400" />
                </div>
                <input className="input flex-1 text-sm" placeholder="Origin (e.g. Chicago, IL)"
                  value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
              </div>

              <Reorder.Group axis="y" values={checkpoints} onReorder={setCheckpoints} className="space-y-3">
                {checkpoints.map((cp, i) => {
                  const warehouseCcos = ccos.filter(c => c.assignedWarehouseId === cp.warehouseId);
                  return (
                    <Reorder.Item key={cp.id} value={cp}>
                      <div className="bg-white/2 border border-white/5 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-slate-600 cursor-grab shrink-0" />
                          <div className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                            <span className="text-[8px] font-black text-blue-400">{i + 1}</span>
                          </div>
                          <input className="input flex-1 text-sm" placeholder={`Checkpoint ${i + 1} location`}
                            value={cp.location} onChange={e => updateCheckpoint(cp.id, e.target.value)} />
                          <button onClick={() => removeCheckpoint(cp.id)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pl-7">
                          <div>
                            <label className="text-[9px] text-slate-600 font-semibold mb-0.5 block">Warehouse</label>
                            <select
                              className="input w-full text-xs py-1"
                              value={cp.warehouseId || ''}
                              onChange={e => updateCheckpointCco(cp.id, e.target.value, '')}
                            >
                              <option value="">— Select Warehouse —</option>
                              {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[9px] text-slate-600 font-semibold block">Officer</label>
                              {cp.warehouseId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetCpId(cp.id);
                                    setCcoForm(f => ({ ...f, assignedWarehouseId: cp.warehouseId || '' }));
                                    setShowAddCco(true);
                                  }}
                                  className="text-[9px] text-accent hover:underline font-bold"
                                >
                                  + Create New
                                </button>
                              )}
                            </div>
                            <select
                              className="input w-full text-xs py-1"
                              value={cp.assignedCcoId || ''}
                              disabled={!cp.warehouseId}
                              onChange={e => updateCheckpointCco(cp.id, cp.warehouseId || '', e.target.value)}
                            >
                              <option value="">— Select Officer —</option>
                              {warehouseCcos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>

              <button onClick={addCheckpoint}
                className="flex items-center gap-2 w-full py-2 px-3 rounded-xl border border-dashed border-white/10 hover:border-accent/30 hover:bg-accent/5 text-slate-500 hover:text-accent transition-all text-xs font-bold ml-7">
                <Plus className="w-3.5 h-3.5" /> Add Checkpoint
              </button>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 border-2 border-purple-500/60 flex items-center justify-center shrink-0">
                  <Flag className="w-3 h-3 text-purple-400" />
                </div>
                <input className="input flex-1 text-sm" placeholder="Destination (e.g. Minneapolis, MN)"
                  value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Cargo Manifest Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cargo Manifest</p>
              <button
                type="button"
                onClick={addCargoItem}
                className="text-[10px] text-accent hover:underline font-bold"
              >
                + Add Cargo Item
              </button>
            </div>
            <div className="space-y-2">
              {cargoItems.map((item, idx) => (
                <div key={item.id} className="bg-white/2 border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="input flex-1 text-xs py-1"
                      placeholder="Item name (e.g. Tablets)"
                      value={item.name}
                      onChange={e => updateCargoItem(item.id, 'name', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeCargoItem(item.id)}
                      className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[8px] text-slate-600 font-semibold block mb-0.5">Quantity</label>
                      <input
                        type="number"
                        className="input w-full text-xs py-1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => updateCargoItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-slate-600 font-semibold block mb-0.5">Unit Weight (kg)</label>
                      <input
                        type="number"
                        className="input w-full text-xs py-1"
                        placeholder="Weight"
                        value={item.weight}
                        onChange={e => updateCargoItem(item.id, 'weight', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-slate-600 font-semibold block mb-0.5">Category</label>
                      <select
                        className="input w-full text-xs py-1"
                        value={item.category}
                        onChange={e => updateCargoItem(item.id, 'category', e.target.value)}
                      >
                        <option value="General">General</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Perishables">Perishables</option>
                        <option value="Chemicals">Chemicals</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Extra Details</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block font-semibold">Planned Distance (km)</label>
                <input type="number" className="input w-full text-sm" placeholder="0"
                  value={form.plannedDistance} onChange={e => setForm(f => ({ ...f, plannedDistance: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block font-semibold">Cargo Type Override</label>
                <input className="input w-full text-sm" placeholder="e.g. High Value Tech"
                  value={form.cargoType} onChange={e => setForm(f => ({ ...f, cargoType: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 mb-1 block font-semibold">Notes</label>
                <textarea rows={2} className="input w-full text-sm resize-none" placeholder="Optional notes..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/5 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 text-sm font-bold">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 btn-primary py-2.5 text-sm font-bold flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Create Trip
          </button>
        </div>

        {/* Inline Create CCO Overlay Modal */}
        <AnimatePresence>
          {showAddCco && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-[#12121c] border border-white/10 rounded-2xl p-4 shadow-2xl space-y-4"
              >
                <div>
                  <h3 className="text-sm font-black text-white">Create Cargo Control Officer</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Add an officer account for checkpoint assignments</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-slate-400 font-semibold mb-0.5 block">Full Name</label>
                    <input
                      className="input w-full text-xs py-1.5"
                      placeholder="Jordan Mills"
                      value={ccoForm.name}
                      onChange={e => setCcoForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-semibold mb-0.5 block">Email / Username</label>
                    <input
                      type="email"
                      className="input w-full text-xs py-1.5"
                      placeholder="jordan.m@transitops.io"
                      value={ccoForm.email}
                      onChange={e => setCcoForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-semibold mb-0.5 block">Password</label>
                    <input
                      type="password"
                      className="input w-full text-xs py-1.5"
                      placeholder="password123"
                      value={ccoForm.password}
                      disabled
                    />
                    <span className="text-[8px] text-slate-600 block mt-0.5">Password is pre-set to password123 for demo logins</span>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-semibold mb-0.5 block">Phone Number (Optional)</label>
                    <input
                      className="input w-full text-xs py-1.5"
                      placeholder="+1-555-0099"
                      value={ccoForm.phone}
                      onChange={e => setCcoForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCco(false)}
                    className="flex-1 btn-secondary text-xs py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCco}
                    className="flex-1 btn-primary text-xs py-2"
                  >
                    Create Officer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── TripsPage Main ──────────────────────────────────────
export default function TripsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);

  // Role-based permissions
  const isSafetyOfficer = user?.role === 'safety_officer';
  const canEdit = !isSafetyOfficer;

  const { data: trips = [], isLoading } = useQuery({ queryKey: ['trips'], queryFn: getTrips });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: getDrivers });

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const driverMap = Object.fromEntries(drivers.map(d => [d.id, d]));

  const dispatchMutation = useMutation({
    mutationFn: dispatchTrip,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Trip dispatched!', 'Vehicle is now on the road.'); },
    onError: (e: any) => toast.error('Dispatch failed', e.message),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => completeTrip(id, { finalOdometer: 0, fuelConsumed: 0, actualDistance: 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Delivered!', 'Trip marked as delivered.'); },
    onError: (e: any) => toast.error('Error', e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelTrip(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Trip cancelled'); },
    onError: (e: any) => toast.error('Error', e.message),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createTrip(data),
    onSuccess: (newTrip) => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip created!', 'New trip added. Select it to view.');
      setCreateOpen(false);
      // Select the newly created trip
      setSearchParams({ id: newTrip.id });
    },
    onError: (e: any) => toast.error('Create failed', e.message),
  });

  const checkpointMutation = useMutation({
    mutationFn: ({ tripId, cpId }: { tripId: string; cpId: string }) => markCheckpoint(tripId, cpId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Checkpoint updated!'); },
    onError: (e: any) => toast.error('Error', e.message),
  });

  const queryId = searchParams.get('id');

  const filtered = trips.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchSearch = !search || [t.id, t.source, t.destination, t.tripName ?? '',
      vehicleMap[t.vehicleId]?.registrationNumber ?? '', driverMap[t.driverId]?.name ?? '']
      .some(s => s.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const selectedTrip = trips.find(t => t.id === queryId) ?? filtered[0] ?? trips[0];

  const { data: verifications = [] } = useQuery({
    queryKey: ['verifications', selectedTrip?.id],
    queryFn: async () => {
      if (!selectedTrip?.id) return [];
      const { getVerificationsByTrip } = await import('../../services/verificationService');
      return getVerificationsByTrip(selectedTrip.id);
    },
    enabled: !!selectedTrip?.id,
    refetchInterval: 4000,
  });

  // Set default selection
  useEffect(() => {
    if (selectedTrip && !queryId) {
      setSearchParams({ id: selectedTrip.id });
    }
  }, [selectedTrip, queryId, setSearchParams]);

  const handleSelectTrip = useCallback((id: string) => {
    setSearchParams({ id });
  }, [setSearchParams]);

  const kpis = [
    { label: 'Active', value: trips.filter(t => !['delivered', 'trip_closed', 'cancelled', 'draft'].includes(t.status)).length, color: 'text-accent' },
    { label: 'Dispatched', value: trips.filter(t => t.status === 'dispatched').length, color: 'text-blue-400' },
    { label: 'Delivered', value: trips.filter(t => t.status === 'delivered' || t.status === 'trip_closed').length, color: 'text-emerald-400' },
    { label: 'Delayed', value: trips.filter(t => t.status === 'delayed').length, color: 'text-red-400' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-90px)] bg-[#060609] -m-4 sm:-m-6 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#0d0d18] shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-black text-white">Trip Dispatcher</h1>
            <p className="text-[9px] text-slate-600">{trips.length} total · {trips.filter(t => !['delivered', 'trip_closed', 'cancelled', 'draft'].includes(t.status)).length} active</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-400 tracking-wider">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* KPI row */}
          {kpis.map(k => (
            <div key={k.label} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/3 border border-white/5 rounded-lg">
              <span className={`text-sm font-black ${k.color}`}>{k.value}</span>
              <span className="text-[8px] text-slate-600 font-bold uppercase">{k.label}</span>
            </div>
          ))}
          {/* Safety Officer sees read-only badge instead of Create button */}
          {isSafetyOfficer ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl ml-1">
              <Eye className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400">Read Only</span>
            </div>
          ) : (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent/90 text-black font-black text-xs rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 ml-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Create Trip
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Left list + Right detail */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Trip List */}
        <div className="w-64 shrink-0 bg-[#09090f] border-r border-white/5 flex flex-col overflow-hidden">
          {/* Search & filter */}
          <div className="px-3 pt-3 pb-2 space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
              <input
                className="bg-white/3 border border-white/6 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-accent/30 w-full transition-all"
                placeholder="Search trips…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-white/3 border border-white/6 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-500 focus:outline-none w-full"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="dispatched">Dispatched</option>
              <option value="in_transit">In Transit</option>
              <option value="delayed">Delayed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Trip list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
            {isLoading ? (
              <div className="flex flex-col gap-1.5 pt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-700">
                <Filter className="w-6 h-6 mb-2 opacity-30" />
                <p className="text-[10px] font-bold">No trips match</p>
              </div>
            ) : (
              filtered.map(trip => (
                <TripListCard
                  key={trip.id}
                  trip={trip}
                  isSelected={selectedTrip?.id === trip.id}
                  onClick={() => handleSelectTrip(trip.id)}
                  vehicleMap={vehicleMap}
                  driverMap={driverMap}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Detail */}
        <div className="flex-1 overflow-hidden">
          {selectedTrip ? (
            <TripDetailPanel
              trip={selectedTrip}
              vehicle={vehicleMap[selectedTrip.vehicleId]}
              driver={driverMap[selectedTrip.driverId]}
              onDispatch={() => dispatchMutation.mutate(selectedTrip.id)}
              onComplete={() => completeMutation.mutate({ id: selectedTrip.id })}
              onCancel={() => cancelMutation.mutate(selectedTrip.id)}
              onMarkCheckpoint={(tripId, cpId) => checkpointMutation.mutate({ tripId, cpId })}
              isMarkingCheckpoint={checkpointMutation.isPending}
              verifications={verifications}
              canEdit={canEdit}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-700">
              <Navigation className="w-12 h-12 opacity-20" />
              <p className="text-xs font-black">Select a trip from the list</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Trip Drawer — only shown to non-safety-officer roles */}
      <AnimatePresence>
        {createOpen && canEdit && (
          <CreateTripModal
            vehicles={vehicles}
            drivers={drivers}
            onClose={() => setCreateOpen(false)}
            onSave={(data) => createMutation.mutate(data)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
