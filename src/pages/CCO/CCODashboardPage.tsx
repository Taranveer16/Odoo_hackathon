import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package, CheckCircle2, Clock, AlertTriangle, Truck,
  User, ArrowRight, RefreshCw, Warehouse, Activity
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getTrips } from '../../services/tripService';
import { mockStore } from '../../mocks/mockStore';

const STATUS_COLORS: Record<string, string> = {
  awaiting_verification: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  approved:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  rejected:   'text-red-400 bg-red-400/10 border-red-400/30',
  in_progress:'text-blue-400 bg-blue-400/10 border-blue-400/30',
  pending:    'text-slate-400 bg-slate-400/10 border-slate-400/30',
};

export default function CCODashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const warehouse = user?.assignedWarehouseId ? mockStore.getWarehouse(user.assignedWarehouseId) : null;

  const { data: allTrips = [], isLoading, refetch } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
    refetchInterval: 4000,
  });

  // Filter trips that have a checkpoint assigned to this CCO
  const myTrips = allTrips.filter(trip =>
    trip.checkpoints.some(cp => cp.assignedCcoId === user?.id)
  );

  const activeTrips = myTrips.filter(t =>
    !['delivered', 'trip_closed', 'cancelled', 'draft'].includes(t.status)
  );
  const awaitingVerification = myTrips.filter(t =>
    t.checkpoints.some(cp =>
      cp.assignedCcoId === user?.id &&
      (cp.verificationStatus === 'pending' || cp.status === 'awaiting_verification')
    )
  );
  const completed = myTrips.filter(t =>
    t.checkpoints.some(cp =>
      cp.assignedCcoId === user?.id && cp.verificationStatus === 'approved'
    )
  );

  const stats = [
    { label: 'Active Trips', value: activeTrips.length, icon: Activity, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Awaiting Verification', value: awaitingVerification.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', pulse: awaitingVerification.length > 0 },
    { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total Assigned', value: myTrips.length, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ];

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">Good day,</p>
          <h1 className="text-xl font-black text-white">{user?.name?.split(' ')[0]}</h1>
          {warehouse && (
            <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-full w-fit">
              <Warehouse className="w-3 h-3 text-accent" />
              <span className="text-[10px] font-black text-accent">{warehouse.name}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white/3 border border-white/6 rounded-2xl p-4"
          >
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color} ${s.pulse ? 'animate-pulse' : ''}`} style={{ width: 18, height: 18 }} />
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Awaiting verification — priority section */}
      {awaitingVerification.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-500/8 border border-amber-500/25 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-xs font-black text-amber-300 uppercase tracking-wider">Action Required</p>
          </div>
          <div className="space-y-2">
            {awaitingVerification.map(trip => {
              const myCp = trip.checkpoints.find(cp =>
                cp.assignedCcoId === user?.id &&
                (cp.verificationStatus === 'pending' || cp.status === 'awaiting_verification')
              );
              const vehicle = mockStore.getVehicle(trip.vehicleId);
              const driver = mockStore.getDriver(trip.driverId);
              return (
                <button
                  key={trip.id}
                  onClick={() => navigate(`/cco/trip/${trip.id}`)}
                  className="w-full text-left bg-white/4 border border-white/8 rounded-xl p-3.5 hover:border-amber-400/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-black text-white">{trip.source.split(',')[0]} → {trip.destination.split(',')[0]}</p>
                      <p className="text-[9px] text-slate-500">{trip.id} · {myCp?.label}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{vehicle?.registrationNumber ?? '—'}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{driver?.name.split(' ')[0] ?? '—'}</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-full">
                      ⚠ Awaiting Your Verification
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* All assigned trips */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Assigned Trips ({myTrips.length})
        </p>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white/3 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : myTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-700">
            <Package className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-bold">No trips assigned yet</p>
            <p className="text-xs mt-1 opacity-70">You'll see trips here once a dispatcher assigns you</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTrips.map((trip, i) => {
              const myCp = trip.checkpoints.find(cp => cp.assignedCcoId === user?.id);
              const vehicle = mockStore.getVehicle(trip.vehicleId);
              const driver = mockStore.getDriver(trip.driverId);
              const vStatus = myCp?.verificationStatus ?? 'pending';

              return (
                <motion.button
                  key={trip.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/cco/trip/${trip.id}`)}
                  className="w-full text-left bg-white/3 border border-white/6 rounded-2xl p-4 hover:border-white/12 hover:bg-white/5 transition-all group active:scale-99"
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div>
                      <p className="text-xs font-black text-white">{trip.source.split(',')[0]} → {trip.destination.split(',')[0]}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{trip.id}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-2.5">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{vehicle?.registrationNumber ?? '—'}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{driver?.name.split(' ')[0] ?? '—'}</span>
                  </div>

                  {myCp && (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-600 truncate">{myCp.label}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[vStatus] ?? STATUS_COLORS.pending}`}>
                        {vStatus === 'approved' ? '✓ Approved' :
                         vStatus === 'rejected' ? '✗ Rejected' :
                         vStatus === 'in_progress' ? 'In Progress' :
                         myCp.status === 'awaiting_verification' ? 'Needs Verification' : 'Pending'}
                      </span>
                    </div>
                  )}

                  {typeof trip.progressPercent === 'number' && (
                    <div className="mt-2.5 w-full bg-white/5 rounded-full h-1">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-700"
                        style={{ width: `${trip.progressPercent}%` }}
                      />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
