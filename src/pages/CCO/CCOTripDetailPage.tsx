import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Truck, User, Package, Clock, MapPin,
  CheckCircle2, AlertTriangle, ChevronRight, Warehouse,
  Circle, Flag, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getTrips } from '../../services/tripService';
import { getVerificationsByTrip } from '../../services/verificationService';
import { mockStore } from '../../mocks/mockStore';

function humanStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function CCOTripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: allTrips = [], isLoading, refetch } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
    refetchInterval: 4000,
  });

  const { data: verifications = [] } = useQuery({
    queryKey: ['verifications', tripId],
    queryFn: () => getVerificationsByTrip(tripId!),
    enabled: !!tripId,
    refetchInterval: 4000,
  });

  const trip = allTrips.find(t => t.id === tripId);
  const myCp = trip?.checkpoints.find(cp => cp.assignedCcoId === user?.id);
  const vehicle = trip ? mockStore.getVehicle(trip.vehicleId) : null;
  const driver = trip ? mockStore.getDriver(trip.driverId) : null;
  const warehouse = myCp?.warehouseId ? mockStore.getWarehouse(myCp.warehouseId) : null;

  const myVerification = verifications.find(v =>
    v.checkpointId === myCp?.id && v.verifiedBy === user?.id
  );

  const canVerify = myCp &&
    (myCp.status === 'awaiting_verification' || myCp.status === 'arrived') &&
    (myCp.verificationStatus === 'pending' || myCp.verificationStatus === 'in_progress');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <RefreshCw className="w-6 h-6 text-accent animate-spin" />
        <p className="text-xs text-slate-500">Loading trip details…</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-bold text-white">Trip not found</p>
        <button onClick={() => navigate('/cco/dashboard')} className="text-accent text-xs font-bold">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Back header */}
      <div className="sticky top-0 z-20 bg-[#07070c]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/cco/dashboard')} className="w-8 h-8 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white truncate">{trip.source.split(',')[0]} → {trip.destination.split(',')[0]}</p>
          <p className="text-[9px] text-slate-500">{trip.id}</p>
        </div>
        <button onClick={() => refetch()} className="text-slate-500 hover:text-white p-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* My checkpoint card */}
        {myCp && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 border ${
              myCp.verificationStatus === 'approved'
                ? 'bg-emerald-500/8 border-emerald-500/25'
                : myCp.verificationStatus === 'rejected'
                ? 'bg-red-500/8 border-red-500/25'
                : canVerify
                ? 'bg-amber-500/8 border-amber-500/25'
                : 'bg-white/3 border-white/8'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">Your Assignment</p>
                <p className="text-sm font-black text-white">{myCp.label}</p>
                {warehouse && (
                  <div className="flex items-center gap-1 mt-1">
                    <Warehouse className="w-3 h-3 text-accent" />
                    <p className="text-[10px] text-slate-400">{warehouse.name}</p>
                  </div>
                )}
              </div>
              {myCp.verificationStatus === 'approved' && (
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
              {myCp.verificationStatus === 'rejected' && (
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
              )}
              {canVerify && (
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mt-1" />
              )}
            </div>

            {/* Status & ETA */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                myCp.verificationStatus === 'approved' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' :
                myCp.verificationStatus === 'rejected' ? 'text-red-400 bg-red-400/10 border-red-400/25' :
                canVerify ? 'text-amber-400 bg-amber-400/10 border-amber-400/25' :
                'text-slate-400 bg-white/5 border-white/10'
              }`}>
                {myCp.verificationStatus === 'approved' ? '✓ Approved' :
                 myCp.verificationStatus === 'rejected' ? '✗ Rejected' :
                 canVerify ? '⚠ Awaiting Verification' :
                 humanStatus(myCp.status)}
              </span>
              {myCp.expectedArrival && myCp.verificationStatus === 'pending' && (
                <span className="text-[9px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ETA {new Date(myCp.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Verification result summary */}
            {myVerification && myVerification.status !== 'in_progress' && (
              <div className="mt-3 pt-3 border-t border-white/8">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Verification Summary</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Total Items', value: myVerification.items.length },
                    { label: 'Discrepancies', value: myVerification.items.filter(i => i.missingQty > 0 || i.damagedQty > 0).length, warn: true },
                    { label: 'Status', value: myVerification.status === 'approved' ? 'Approved' : 'Rejected' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/4 rounded-xl p-2 text-center">
                      <p className={`text-sm font-black ${s.warn && Number(s.value) > 0 ? 'text-red-400' : 'text-white'}`}>{s.value}</p>
                      <p className="text-[8px] text-slate-600">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {canVerify && (
              <button
                onClick={() => navigate(`/cco/verify/${trip.id}/${myCp.id}`)}
                className="mt-4 w-full py-3.5 bg-accent text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-accent/25 active:scale-98 transition-all"
              >
                <Package className="w-4 h-4" />
                Start Cargo Verification
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}

        {/* Trip info */}
        <div className="bg-white/3 border border-white/6 rounded-2xl p-4 space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Trip Information</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Vehicle', value: vehicle?.registrationNumber ?? '—', icon: Truck },
              { label: 'Driver', value: driver?.name ?? '—', icon: User },
              { label: 'Cargo', value: trip.cargoType || '—', icon: Package },
              { label: 'Weight', value: `${trip.cargoWeight.toLocaleString()} kg`, icon: Package },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2">
                <item.icon className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[8px] text-slate-600 font-semibold uppercase">{item.label}</p>
                  <p className="text-xs text-white font-bold truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          {trip.eta && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <p className="text-xs text-slate-300">
                ETA: <span className="text-accent font-black">{new Date(trip.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          )}
        </div>

        {/* Cargo Manifest */}
        {trip.cargoManifest && trip.cargoManifest.length > 0 && (
          <div className="bg-white/3 border border-white/6 rounded-2xl p-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-3">
              Cargo Manifest ({trip.cargoManifest.length} items)
            </p>
            <div className="space-y-2.5">
              {trip.cargoManifest.map((item) => {
                const myVerifItem = myVerification?.items.find(i => i.cargoItemId === item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-white/4 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500">
                        <span>{item.category}</span>
                        <span>·</span>
                        <span>{item.weight} kg/unit</span>
                        {item.barcode && <span>· {item.barcode}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-black text-white">{item.quantity}</p>
                      <p className="text-[8px] text-slate-500">Expected</p>
                      {myVerifItem && myVerifItem.receivedQty !== item.quantity && (
                        <p className="text-[8px] text-red-400 font-bold mt-0.5">
                          Got {myVerifItem.receivedQty}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Route checkpoints */}
        <div className="bg-white/3 border border-white/6 rounded-2xl p-4">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-3">Route Timeline</p>
          <div className="relative pl-2 space-y-1">
            <div className="absolute left-3.5 top-3 bottom-3 w-px bg-gradient-to-b from-emerald-500/30 via-accent/20 to-white/5" />
            {[
              { id: 'origin', label: trip.source.split(',')[0], location: trip.source, status: 'completed', type: 'origin' },
              ...trip.checkpoints.map(cp => ({
                id: cp.id, label: cp.label, location: cp.location,
                status: cp.status, type: 'checkpoint',
                isAssignedToMe: cp.assignedCcoId === user?.id,
                verificationStatus: cp.verificationStatus,
              })),
              { id: 'dest', label: trip.destination.split(',')[0], location: trip.destination, status: trip.status === 'delivered' ? 'completed' : 'pending', type: 'destination' },
            ].map((stop, i) => {
              const isDone = stop.status === 'completed' || stop.status === 'departed';
              const isMine = 'isAssignedToMe' in stop && stop.isAssignedToMe;
              const vStatus = 'verificationStatus' in stop ? stop.verificationStatus : null;
              return (
                <div key={stop.id} className={`flex items-start gap-3 py-2 px-2 rounded-xl ${isMine ? 'bg-accent/5 border border-accent/15' : ''}`}>
                  <div className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    isDone ? 'bg-emerald-500 border-emerald-500' :
                    isMine ? 'bg-accent/20 border-accent' :
                    'bg-white/5 border-white/15'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> :
                     stop.type === 'origin' ? <Flag className="w-2.5 h-2.5 text-white" /> :
                     <Circle className="w-2 h-2 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-bold truncate ${isMine ? 'text-accent' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                        {stop.label}
                      </p>
                      {isMine && <span className="text-[8px] bg-accent/15 text-accent px-1.5 py-0.5 rounded font-black shrink-0">MINE</span>}
                    </div>
                    <p className="text-[9px] text-slate-600">{stop.location}</p>
                    {vStatus && vStatus !== 'not_required' && (
                      <span className={`text-[8px] font-black mt-0.5 inline-block ${
                        vStatus === 'approved' ? 'text-emerald-400' :
                        vStatus === 'rejected' ? 'text-red-400' :
                        vStatus === 'in_progress' ? 'text-blue-400' :
                        'text-amber-400'
                      }`}>
                        {vStatus === 'approved' ? '✓ Verification Approved' :
                         vStatus === 'rejected' ? '✗ Verification Rejected' :
                         vStatus === 'in_progress' ? '↻ Verification In Progress' :
                         '○ Pending Verification'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
