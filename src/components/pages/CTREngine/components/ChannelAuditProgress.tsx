// src/components/pages/CTREngine/components/ChannelAuditProgress.tsx
// Staged progress for the Channel Packaging Audit (~50s deep audit).
// The backend is a single request (no streaming), so this advances through the
// audit's REAL stages on estimated timings and asymptotes toward ~95% — the
// parent unmounts it the moment the actual result (or an error) arrives, so it
// never shows a fake "done". It tells the user exactly what's happening instead
// of a bare spinner.

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, ListVideo, Users, ScanSearch, FileText, Check } from 'lucide-react';

const STAGES = [
  { label: 'Resolving the channel', icon: Link2, secs: 4 },
  { label: 'Pulling your last videos', icon: ListVideo, secs: 5 },
  { label: 'Building your swipe file', icon: Users, secs: 9 },
  { label: 'Observing your thumbnails', icon: ScanSearch, secs: 38, hint: 'the deep part' },
  { label: 'Writing up the experiments', icon: FileText, secs: 8 },
];
const TOTAL = STAGES.reduce((a, s) => a + s.secs, 0); // ~64s of estimated headroom

const ChannelAuditProgress: React.FC = () => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 250);
    return () => clearInterval(id);
  }, []);

  // Which stage we're in, from cumulative estimated durations.
  let acc = 0;
  let currentIdx = STAGES.length - 1;
  for (let i = 0; i < STAGES.length; i++) {
    if (elapsed < acc + STAGES[i].secs) {
      currentIdx = i;
      break;
    }
    acc += STAGES[i].secs;
  }

  // Never reach 100% on our own — the real result unmounts this component.
  const pct = Math.min(95, Math.round((elapsed / TOTAL) * 95));

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-black/50 border border-[#fa7517]/20 rounded-2xl p-5 sm:p-6 mb-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-white">Auditing your channel…</p>
        <p className="text-xs text-gray-400 tabular-nums">{pct}%</p>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden mb-5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#fa7517] to-orange-500"
          animate={{ width: `${pct}%` }}
          transition={{ ease: 'easeOut', duration: 0.4 }}
        />
      </div>

      {/* Stage list */}
      <div className="space-y-2.5">
        {STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const Icon = stage.icon;
          return (
            <div
              key={stage.label}
              className={`flex items-center gap-3 text-sm transition-colors ${
                active ? 'text-white' : done ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? 'border-green-500/40 bg-green-500/10 text-green-400'
                    : active
                    ? 'border-[#fa7517]/50 bg-[#fa7517]/10 text-[#fa7517]'
                    : 'border-gray-700/50 text-gray-600'
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Icon className="h-3.5 w-3.5 animate-pulse" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="font-medium">{stage.label}</span>
              {active && stage.hint && (
                <span className="text-xs text-gray-500">— {stage.hint}, hang tight</span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ChannelAuditProgress;
