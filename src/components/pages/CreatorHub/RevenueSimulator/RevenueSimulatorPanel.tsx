// src/components/pages/CreatorHub/RevenueSimulator/RevenueSimulatorPanel.tsx
//
// The simulator as a panel on the right edge of the screen. It is NOT a
// modal: there is no overlay and the page behind stays usable, so a creator
// changes the price in the form and reads the figures move beside it.
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cx, form } from '../Business/businessStyles';
import RevenueSimulator, { type LinkedPass } from './RevenueSimulator';

/** Room to leave on the right of the page while the panel is open (wide screens only). */
export const SIMULATOR_PANEL_ROOM = 'xl:pr-[27rem]';

interface RevenueSimulatorPanelProps {
  open: boolean;
  onClose: () => void;
  linked?: LinkedPass;
}

const RevenueSimulatorPanel: React.FC<RevenueSimulatorPanelProps> = ({ open, onClose, linked }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <aside
      aria-labelledby="revenue-simulator-panel-title"
      className="fixed bottom-0 right-0 top-16 z-40 flex w-full max-w-[26rem] flex-col border-l border-gray-800/70 bg-black text-white shadow-[-32px_0_80px_rgba(0,0,0,0.8)]"
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-800/50 px-4">
        <h2 id="revenue-simulator-panel-title" className={cx(form.panelTitle, 'min-w-0 flex-1 truncate')}>
          Content Pass revenue simulator
        </h2>
        <button type="button" onClick={onClose} aria-label="Close the simulator" className={cx(form.ghostButton, 'w-8 justify-center px-0')}>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <RevenueSimulator linked={linked} layout="panel" />
      </div>
    </aside>
  );
};

export default RevenueSimulatorPanel;
