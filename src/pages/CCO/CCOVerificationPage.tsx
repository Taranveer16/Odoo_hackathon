import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, X,
  Package, ChevronDown, ChevronUp, Loader2, ClipboardCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getTrips } from '../../services/tripService';
import { getVerificationByCheckpoint, createVerification, submitVerification } from '../../services/verificationService';
import { toast } from '../../store/toastStore';
import type { CargoVerificationItem, VerificationItemStatus } from '../../types';

const ITEM_STATUSES: { key: VerificationItemStatus; label: string; color: string; icon: string }[] = [
  { key: 'received',  label: 'Received',  color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300', icon: '✓' },
  { key: 'damaged',   label: 'Damaged',   color: 'bg-amber-500/20 border-amber-500/50 text-amber-300',   icon: '⚠' },
  { key: 'missing',   label: 'Missing',   color: 'bg-red-500/20 border-red-500/50 text-red-300',         icon: '✗' },
  { key: 'rejected',  label: 'Rejected',  color: 'bg-rose-600/20 border-rose-600/50 text-rose-300',      icon: '🚫' },
];

function QuantityInput({ label, value, onChange, max, color = 'text-white' }: {
  label: string; value: number; onChange: (v: number) => void; max?: number; color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-white font-black text-lg active:scale-90 transition-transform"
        >−</button>
        <span className={`w-10 text-center text-lg font-black ${color}`}>{value}</span>
        <button
          onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
          className="w-8 h-8 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-white font-black text-lg active:scale-90 transition-transform"
        >+</button>
      </div>
    </div>
  );
}

export default function CCOVerificationPage() {
  const { tripId, checkpointId } = useParams<{ tripId: string; checkpointId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [items, setItems] = useState<CargoVerificationItem[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [overallNotes, setOverallNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState<'approved' | 'rejected' | null>(null);

  const { data: allTrips = [], isLoading } = useQuery({ queryKey: ['trips'], queryFn: getTrips });
  const trip = allTrips.find(t => t.id === tripId);
  const checkpoint = trip?.checkpoints.find(cp => cp.id === checkpointId);

  const { data: existingVerif } = useQuery({
    queryKey: ['verification', tripId, checkpointId],
    queryFn: () => getVerificationByCheckpoint(tripId!, checkpointId!),
    enabled: !!tripId && !!checkpointId,
  });

  // Initialize items from cargo manifest
  useEffect(() => {
    if (!trip?.cargoManifest || items.length > 0) return;
    const initialItems: CargoVerificationItem[] = trip.cargoManifest.map(ci => ({
      cargoItemId: ci.id,
      name: ci.name,
      expectedQty: ci.quantity,
      receivedQty: ci.quantity,
      missingQty: 0,
      damagedQty: 0,
      removedQty: 0,
      status: 'received' as VerificationItemStatus,
      notes: '',
    }));
    setItems(initialItems);
  }, [trip?.cargoManifest]);

  // If existing in_progress verification, load it
  useEffect(() => {
    if (existingVerif && existingVerif.status === 'in_progress') {
      setVerificationId(existingVerif.id);
      setItems(existingVerif.items);
    }
  }, [existingVerif]);

  const createMutation = useMutation({
    mutationFn: () => createVerification({
      tripId: tripId!,
      checkpointId: checkpointId!,
      warehouseId: checkpoint?.warehouseId ?? '',
      verifiedBy: user?.id ?? '',
      verifiedByName: user?.name ?? '',
      items,
    }),
    onSuccess: (v) => {
      setVerificationId(v.id);
      qc.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Session started', 'Verification session is now active.');
    },
    onError: (e: any) => toast.error('Error', e.message),
  });

  const submitMutation = useMutation({
    mutationFn: (decision: 'approved' | 'rejected') =>
      submitVerification(verificationId!, items, decision, overallNotes),
    onSuccess: (_, decision) => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['verification', tripId, checkpointId] });
      toast.success(
        decision === 'approved' ? 'Shipment Approved!' : 'Shipment Rejected',
        decision === 'approved' ? 'Cargo cleared for dispatch.' : 'Dispatcher has been notified.'
      );
      navigate(`/cco/trip/${tripId}`);
    },
    onError: (e: any) => toast.error('Submission failed', e.message),
  });

  const updateItem = (idx: number, field: keyof CargoVerificationItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: value };
      // Auto-calc missing qty
      if (field === 'receivedQty') {
        const missing = Math.max(0, item.expectedQty - item.receivedQty - item.removedQty);
        item.missingQty = missing;
        item.status = item.receivedQty === item.expectedQty ? 'received'
          : item.receivedQty === 0 ? 'missing'
          : item.damagedQty > 0 ? 'damaged'
          : 'missing';
      }
      updated[idx] = item;
      return updated;
    });
  };

  const totalDiscrepancies = items.filter(i => i.missingQty > 0 || i.damagedQty > 0 || i.removedQty > 0).length;
  const allReceived = items.every(i => i.status === 'received' && i.missingQty === 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!trip || !checkpoint) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-bold text-white">Checkpoint not found</p>
        <button onClick={() => navigate(-1)} className="text-accent text-xs font-bold">← Go Back</button>
      </div>
    );
  }

  if (existingVerif && (existingVerif.status === 'approved' || existingVerif.status === 'rejected')) {
    return (
      <div className="px-4 py-8 flex flex-col items-center text-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${existingVerif.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {existingVerif.status === 'approved'
            ? <CheckCircle2 className="w-8 h-8 text-white" />
            : <X className="w-8 h-8 text-white" />}
        </div>
        <div>
          <h2 className="text-xl font-black text-white">
            {existingVerif.status === 'approved' ? 'Verification Complete' : 'Shipment Rejected'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {existingVerif.status === 'approved'
              ? 'Cargo has been approved and shipment can proceed.'
              : 'Shipment was rejected. Dispatcher has been notified.'}
          </p>
          {existingVerif.verifiedAt && (
            <p className="text-xs text-slate-500 mt-2">
              {new Date(existingVerif.verifiedAt).toLocaleString()}
            </p>
          )}
        </div>
        <button onClick={() => navigate(`/cco/trip/${tripId}`)} className="btn-primary px-6 py-3 font-black">
          Back to Trip
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#07070c]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(`/cco/trip/${tripId}`)} className="w-8 h-8 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white">Cargo Verification</p>
          <p className="text-[9px] text-slate-500">{checkpoint.label} · {trip.id}</p>
        </div>
        {totalDiscrepancies > 0 && (
          <span className="text-[9px] font-black text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
            {totalDiscrepancies} discrepancy
          </span>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Items', value: items.length, color: 'text-white' },
            { label: 'Discrepancies', value: totalDiscrepancies, color: totalDiscrepancies > 0 ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Status', value: verificationId ? 'In Progress' : 'Not Started', color: verificationId ? 'text-blue-400' : 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/3 border border-white/6 rounded-xl p-2.5 text-center">
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-[8px] text-slate-600">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Start verification button if not started */}
        {!verificationId && (
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || items.length === 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            Begin Verification Session
          </button>
        )}

        {/* Cargo items */}
        <div className="space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Cargo Items ({items.length})
          </p>
          {items.length === 0 && (
            <div className="text-center py-8 text-slate-600">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold">No cargo manifest defined</p>
              <p className="text-[10px] mt-1">Contact dispatcher to add cargo items to this trip</p>
            </div>
          )}
          {items.map((item, idx) => {
            const isExpanded = expandedIdx === idx;
            const hasDiscrepancy = item.missingQty > 0 || item.damagedQty > 0 || item.removedQty > 0;

            return (
              <motion.div
                key={item.cargoItemId}
                layout
                className={`bg-white/3 border rounded-2xl overflow-hidden ${
                  hasDiscrepancy ? 'border-red-500/25' : 'border-white/6'
                }`}
              >
                {/* Item header */}
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      item.status === 'received' ? 'bg-emerald-500/20 text-emerald-300' :
                      item.status === 'damaged'  ? 'bg-amber-500/20 text-amber-300' :
                      item.status === 'missing'  ? 'bg-red-500/20 text-red-300' :
                      'bg-rose-600/20 text-rose-300'
                    }`}>
                      {ITEM_STATUSES.find(s => s.key === item.status)?.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">{item.name}</p>
                      <p className="text-[9px] text-slate-500">
                        Expected: <span className="text-white font-bold">{item.expectedQty}</span>
                        {hasDiscrepancy && (
                          <span className="text-red-400 ml-2 font-bold">
                            Δ {item.missingQty > 0 ? `-${item.missingQty}` : ''}{item.damagedQty > 0 ? ` ⚠${item.damagedQty}` : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                        {/* Quantity controls */}
                        <div className="flex items-start justify-around gap-2">
                          <QuantityInput
                            label="Received"
                            value={item.receivedQty}
                            max={item.expectedQty}
                            onChange={v => updateItem(idx, 'receivedQty', v)}
                            color={item.receivedQty < item.expectedQty ? 'text-red-400' : 'text-emerald-400'}
                          />
                          <QuantityInput
                            label="Damaged"
                            value={item.damagedQty}
                            onChange={v => updateItem(idx, 'damagedQty', v)}
                            color={item.damagedQty > 0 ? 'text-amber-400' : 'text-white'}
                          />
                          <QuantityInput
                            label="Removed"
                            value={item.removedQty}
                            onChange={v => updateItem(idx, 'removedQty', v)}
                            color={item.removedQty > 0 ? 'text-purple-400' : 'text-white'}
                          />
                        </div>

                        {/* Auto discrepancy */}
                        {item.missingQty > 0 && (
                          <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <p className="text-xs text-red-300 font-bold">
                              {item.missingQty} units missing (Expected {item.expectedQty}, Got {item.receivedQty})
                            </p>
                          </div>
                        )}

                        {/* Status selector */}
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Mark As</p>
                          <div className="grid grid-cols-2 gap-2">
                            {ITEM_STATUSES.map(s => (
                              <button
                                key={s.key}
                                onClick={() => updateItem(idx, 'status', s.key)}
                                className={`py-2 px-3 rounded-xl border text-xs font-black transition-all active:scale-95 ${
                                  item.status === s.key ? s.color : 'bg-white/4 border-white/8 text-slate-500'
                                }`}
                              >
                                {s.icon} {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Item Notes</p>
                          <textarea
                            rows={2}
                            value={item.notes ?? ''}
                            onChange={e => updateItem(idx, 'notes', e.target.value)}
                            placeholder="Any additional notes about this item…"
                            className="w-full bg-white/4 border border-white/8 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-accent/40 resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Overall notes */}
        {verificationId && (
          <div className="bg-white/3 border border-white/6 rounded-2xl p-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Overall Notes</p>
            <textarea
              rows={3}
              value={overallNotes}
              onChange={e => setOverallNotes(e.target.value)}
              placeholder="Add any general remarks about the shipment…"
              className="w-full bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-accent/40 resize-none"
            />
          </div>
        )}
      </div>

      {/* Sticky action footer */}
      {verificationId && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30">
          <div className="bg-[#0d0d18]/95 backdrop-blur border border-white/10 rounded-2xl p-3 flex gap-3 shadow-2xl">
            <button
              onClick={() => setShowConfirm('rejected')}
              className="flex-1 py-3.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-black text-sm rounded-xl border border-red-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <X className="w-4 h-4" /> REJECT
            </button>
            <button
              onClick={() => setShowConfirm('approved')}
              className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              {allReceived ? 'APPROVE SHIPMENT' : 'APPROVE WITH DISCREPANCIES'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirm(null)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="relative z-10 w-full max-w-md bg-[#12121e] border-t border-white/10 rounded-t-3xl px-5 pt-5 pb-8"
            >
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${showConfirm === 'approved' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {showConfirm === 'approved'
                  ? <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  : <X className="w-7 h-7 text-red-400" />}
              </div>
              <h3 className="text-lg font-black text-white text-center">
                {showConfirm === 'approved' ? 'Approve Shipment?' : 'Reject Shipment?'}
              </h3>
              <p className="text-sm text-slate-400 text-center mt-2">
                {showConfirm === 'approved'
                  ? totalDiscrepancies > 0
                    ? `You are approving with ${totalDiscrepancies} discrepancy noted. The dispatcher will be informed.`
                    : 'All cargo items match the manifest. Shipment will be cleared for dispatch.'
                  : 'The shipment will be halted and the dispatcher will be notified immediately.'}
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowConfirm(null)} className="flex-1 py-3.5 bg-white/6 border border-white/10 text-white font-black rounded-xl transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => { submitMutation.mutate(showConfirm); setShowConfirm(null); }}
                  disabled={submitMutation.isPending}
                  className={`flex-[2] py-3.5 font-black text-white rounded-xl flex items-center justify-center gap-2 transition-all ${
                    showConfirm === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {submitMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : showConfirm === 'approved' ? '✓ Confirm Approval' : '✗ Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
