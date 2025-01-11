import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { styles } from './styles';

export const HealthCard = ({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={styles.card}
  >
    <h3 className={styles.cardTitle}>
      <Icon className={styles.cardIcon} />
      {title}
    </h3>
    {children}
  </motion.div>
);

export const StatusIndicator = ({ status }: { status: 'healthy' | 'unhealthy' }) => (
  <div className={styles.statusIndicator(status === 'healthy')}>
    {status === 'healthy' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
    <span className="capitalize">{status}</span>
  </div>
);

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: 'positive' | 'negative' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  icon: Icon,
  trend 
}) => (
  <div className={styles.metric.container}>
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-[#fa7517]" />}
      <div className={styles.metric.label}>{label}</div>
    </div>
    <div className={`${styles.metric.value} ${
      trend === 'positive' ? 'text-green-400' :
      trend === 'negative' ? 'text-red-400' :
      'text-white'
    }`}>
      {value}
    </div>
  </div>
);