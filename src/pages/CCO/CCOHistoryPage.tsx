import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, X, Clock, Package } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getVerificationsByWarehouse } from '../../services/verificationService';

export default function CCOHistoryPage() {
  const { user } = useAuthStore();

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['cco-verifications', user?.assignedWarehouseId],
    queryFn: () => getVerificationsByWarehouse(user?.assignedWarehouseId ?? ''),
    enabled: !!user?.assignedWarehouseId,
  });

  const mine = verifications.filter(v => v.verifiedBy === user?.id);

  return (
    <div className="px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-black text-white">Verification History</h1>
        <p className="text-xs text-slate-500 mt-0.5">{mine.length} verification{mine.length !== 1 ? 's' : ''} completed</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : mine.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-700">
          <Clock className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-bold">No verifications yet</p>
          <p className="text-[10px] mt-1">Completed verifications will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((v, i) => {
            const totalDiscrepancies = v.items.filter(i => i.missingQty > 0 || i.damagedQty > 0).length;
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white/3 border rounded-2xl p-4 ${
                  v.status === 'approved' ? 'border-emerald-500/20' :
                  v.status === 'rejected' ? 'border-red-500/20' : 'border-white/6'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-black text-white">{v.tripId}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{v.checkpointId}</p>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    v.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {v.status === 'approved'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      : <X className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-slate-500">
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" />{v.items.length} items</span>
                  {totalDiscrepancies > 0 && (
                    <span className="text-red-400 font-bold">{totalDiscrepancies} discrepancy</span>
                  )}
                  {v.verifiedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(v.verifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {v.overallNotes && (
                  <p className="text-[10px] text-slate-500 mt-2 italic">"{v.overallNotes}"</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
