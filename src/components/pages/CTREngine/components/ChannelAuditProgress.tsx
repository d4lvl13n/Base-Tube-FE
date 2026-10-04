import React from "react";
import { motion } from "framer-motion";
import { ScanSearch, ListVideo, Users, FileText } from "lucide-react";

// The API is one request, not a progress stream. Show the work involved without
// inventing completed stages or percentages from elapsed time.
const ChannelAuditProgress: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="mx-auto mb-6 max-w-lg rounded-2xl border border-[#fa7517]/20 bg-[#fa7517]/[0.025] p-6"
    role="status"
  >
    <div className="mb-4 flex items-center gap-3">
      <ScanSearch className="h-5 w-5 animate-pulse text-[#fa7517]" />
      <p className="font-semibold text-white">Preparing your channel audit…</p>
    </div>
    <p className="mb-5 text-sm leading-relaxed text-zinc-400">
      We collect public evidence, inspect up to eight thumbnails and turn the
      findings into practical decisions. This can take a few minutes.
    </p>
    <ul className="space-y-3 text-sm text-zinc-300">
      <li className="flex items-center gap-3">
        <ListVideo className="h-4 w-4 text-zinc-500" />
        Channel and video metadata
      </li>
      <li className="flex items-center gap-3">
        <Users className="h-4 w-4 text-zinc-500" />
        Competitive examples and possible outliers
      </li>
      <li className="flex items-center gap-3">
        <ScanSearch className="h-4 w-4 text-zinc-500" />
        Actual thumbnail inspection
      </li>
      <li className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-zinc-500" />
        Prioritized advice and suggested variants
      </li>
    </ul>
    <p className="mt-5 text-xs text-zinc-500">
      No images are generated during this audit.
    </p>
  </motion.div>
);
export default ChannelAuditProgress;
