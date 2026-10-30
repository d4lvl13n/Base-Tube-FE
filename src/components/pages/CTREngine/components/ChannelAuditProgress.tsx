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
      We read your recent videos and Shorts, watch how a few of them open, compare
      your formats and look at creators your size. This can take up to 10 minutes.
    </p>
    <ul className="space-y-3 text-sm text-zinc-300">
      <li className="flex items-center gap-3">
        <ListVideo className="h-4 w-4 text-zinc-500" />
        Your videos, Shorts and their numbers
      </li>
      <li className="flex items-center gap-3">
        <Users className="h-4 w-4 text-zinc-500" />
        Creators your size on the same topics
      </li>
      <li className="flex items-center gap-3">
        <ScanSearch className="h-4 w-4 text-zinc-500" />
        What your videos say and show
      </li>
      <li className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-zinc-500" />
        3 to 5 moves for your next uploads
      </li>
    </ul>
    <p className="mt-5 text-xs text-zinc-500">
      No images are generated during this audit.
    </p>
  </motion.div>
);
export default ChannelAuditProgress;
