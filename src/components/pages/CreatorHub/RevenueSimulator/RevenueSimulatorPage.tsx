// src/components/pages/CreatorHub/RevenueSimulator/RevenueSimulatorPage.tsx
import React from 'react';
import { frame, text } from '../Business/businessStyles';
import RevenueSimulator from './RevenueSimulator';

const RevenueSimulatorPage: React.FC = () => (
  <main className={frame.page}>
    <div className={frame.business}>
      <header>
        <h1 className={text.pageTitle}>Content Pass revenue simulator</h1>
        <p className={text.pageSubtitle}>
          What a pass could earn you: one fixed price, a fixed number of passes, and a royalty each time one is resold.
        </p>
      </header>
      <RevenueSimulator layout="page" />
    </div>
  </main>
);

export default RevenueSimulatorPage;
