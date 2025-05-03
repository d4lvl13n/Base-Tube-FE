import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash, Film, CheckCircle2, Loader, AlertCircle, Youtube, AlertTriangle, Check } from 'lucide-react';
import { youtubeApi, getYouTubeID } from '../../../../api/youtube';

interface VideoRow {
  value: string;
  title?: string;
  loading?: boolean;
  error?: string | null;
}

interface AddVideoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videos: { url: string; title?: string }[]) => void;
  isLoading: boolean; // overall loading while submitting
  passTitle?: string;
}

const AddVideoDrawer: React.FC<AddVideoDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  passTitle = 'Content Pass'
}) => {
  const [rows, setRows] = useState<VideoRow[]>([{ value: '' }]);
  const processedUrls = useRef<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset drawer state when opened
  useEffect(() => {
    if (isOpen) {
      setRows([{ value: '' }]);
      processedUrls.current.clear();
      setShowConfirmation(false);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Metadata fetching per row
  useEffect(() => {
    rows.forEach((row, idx) => {
      if (!row.value || row.loading || row.title || row.error) return;
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(row.value)) {
        if (row.value) updateRow(idx, { error: 'Invalid URL' });
        return;
      }
      if (processedUrls.current.has(row.value)) return;
      processedUrls.current.add(row.value);
      updateRow(idx, { loading: true, error: null });
      youtubeApi.getVideoMetadata(row.value)
        .then(meta => {
          updateRow(idx, { title: meta.title || '', loading: false });
        })
        .catch(() => {
          updateRow(idx, { loading: false, error: 'Failed to fetch metadata' });
        });
    });
  }, [rows]);

  const updateRow = (index: number, patch: Partial<VideoRow>) => {
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows(r => [...r, { value: '' }]);
  const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx));

  const allValid = rows.some(r => r.value && !r.loading && !r.error);

  const handlePrimary = () => {
    setShowConfirmation(true);
  };

  const confirmAdd = () => {
    setShowConfirmation(false);
    const payload = rows
      .filter(r => r.value && !r.loading && !r.error)
      .map(r => ({ url: r.value, title: r.title }));
    if (payload.length) onSubmit(payload);
  };

  // success toast after submission done
  useEffect(() => {
    if (!isLoading && !showConfirmation && rows.length > 0) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-gradient-to-b from-gray-900 to-black z-50 shadow-2xl border-l border-white/10 flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 25 }} onClick={e => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3"><Film className="w-6 h-6 text-[#fa7517]" /><h2 className="text-xl font-bold">Add Videos</h2></div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            {/* body - scrollable area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-white/5 p-4 rounded border border-white/10">Adding to: <span className="font-semibold">{passTitle}</span></div>
              {rows.map((row, idx) => (
                <div key={idx} className="space-y-2 bg-black/20 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2">
                    <input value={row.value} onChange={e => updateRow(idx, { value: e.target.value, title: undefined, error: null })} placeholder="https://youtube.com/watch?v=..." className="flex-1 p-3 bg-black/40 border border-white/10 rounded focus:outline-none" />
                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(idx)} className="p-2 hover:bg-white/5 rounded"><Trash className="w-4 h-4 text-red-500" /></button>
                    )}
                  </div>
                  {row.loading && <p className="text-sm text-yellow-400 flex items-center gap-1"><Loader className="animate-spin w-4 h-4" /> Fetching metadata…</p>}
                  {row.error && <p className="text-sm text-red-500">{row.error}</p>}
                  {row.title && !row.loading && (
                    <input value={row.title} onChange={e => updateRow(idx, { title: e.target.value })} className="w-full p-2 bg-black/30 border border-white/10 rounded" />
                  )}
                  {row.value && !row.loading && !row.error && (
                    <div className="aspect-video mt-2">
                      <iframe src={`https://www.youtube.com/embed/${getYouTubeID(row.value)}`} className="w-full h-full" title="preview" />
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={addRow} className="flex items-center gap-2 text-[#fa7517] hover:text-orange-400"><Plus className="w-4 h-4" /> Add another video</button>
            </div>
            {/* footer - fixed at bottom */}
            <div className="p-6 border-t border-white/10 flex gap-4 flex-shrink-0">
              <button onClick={onClose} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded">Cancel</button>
              <button onClick={handlePrimary} disabled={!allValid || isLoading || rows.some(r => r.loading)} className="flex-1 py-3 bg-gradient-to-r from-[#fa7517] to-orange-600 rounded text-white disabled:opacity-50 flex items-center justify-center">
                {isLoading ? <><Loader className="animate-spin w-5 h-5 mr-2" />Adding…</> : 'Add videos'}
              </button>
            </div>

            {/* Confirmation overlay */}
            <AnimatePresence>
              {showConfirmation && (
                <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div className="bg-gray-900 p-6 rounded-lg border border-gray-700 w-full max-w-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" />Confirm add {rows.filter(r=>r.value).length} videos</h3>
                    <p className="text-sm text-gray-300 mb-6">This will add the following videos to your pass:</p>
                    <ul className="space-y-2 mb-6 max-h-40 overflow-y-auto pr-2">
                      {rows.filter(r=>r.value).map((r,i)=>(<li key={i} className="text-sm text-gray-400 truncate">• {r.title||r.value}</li>))}
                    </ul>
                    <div className="flex gap-3"><button onClick={()=>setShowConfirmation(false)} className="flex-1 py-2 bg-gray-800 rounded">Cancel</button><button onClick={confirmAdd} className="flex-1 py-2 bg-gradient-to-r from-[#fa7517] to-orange-600 rounded text-white">Confirm</button></div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success toast */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-green-600/90 px-4 py-3 rounded flex items-center gap-2"><Check className="w-5 h-5" /><span>Videos added!</span></motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddVideoDrawer; 