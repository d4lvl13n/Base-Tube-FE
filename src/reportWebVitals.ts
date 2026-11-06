import type { Metric } from 'web-vitals';

let installed = false;
const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  if (installed || !onPerfEntry) return;
  installed = true;
  void import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }).catch(() => { /* Optional instrumentation must not interrupt the app. */ });
};

export default reportWebVitals;
