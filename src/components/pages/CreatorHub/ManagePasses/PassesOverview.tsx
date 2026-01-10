// src/components/pages/CreatorHub/ManagePasses/PassesOverview.tsx
import React, { useMemo } from 'react';
import { DollarSign, Crown, Users, Package } from 'lucide-react';
import StatsCard from '../StatsCard';
import { useCreatorPasses } from '../../../../hooks/usePass';

const PassesOverview: React.FC = () => {
  const { data: passes, isLoading, error } = useCreatorPasses();
  
  const stats = useMemo(() => {
    if (!passes) return null;
    
    const totalPasses = passes.length;
    
    // Calculate total minted vs supply
    let totalMinted = 0;
    let totalSupplyCap = 0;
    let totalRevenue = 0;
    
    passes.forEach(pass => {
      // Count sold passes (minted + reserved for pending Stripe purchases)
      const passSold = (pass.minted_count || 0) + (pass.reserved_count || 0);
      totalMinted += passSold;

      // Add to supply cap if finite
      if (pass.supply_cap) {
        totalSupplyCap += pass.supply_cap;
      }

      // Calculate revenue (total sold * price_cents)
      totalRevenue += passSold * pass.price_cents;
    });
    
    // Calculate remaining (only for passes with supply caps)
    const totalRemaining = totalSupplyCap - totalMinted;
    
    return {
      totalPasses,
      totalMinted,
      totalRemaining,
      totalRevenue: (totalRevenue / 100).toFixed(2) // Convert cents to dollars/euros
    };
  }, [passes]);
  
  const errorMessage = error ? 'Failed to load data' : undefined;
  
  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Crown}
          title="Total Passes"
          value={stats?.totalPasses || 0}
          change={0} // No change indicator for now
          loading={isLoading}
          error={errorMessage}
          subtitle="Created passes"
        />
        
        <StatsCard
          icon={Users}
          title="Total Sold"
          value={stats?.totalMinted || 0}
          change={0}
          loading={isLoading}
          error={errorMessage}
          subtitle="Passes purchased"
        />
        
        <StatsCard
          icon={Package}
          title="Available Supply"
          value={stats?.totalRemaining || 0}
          change={0}
          loading={isLoading}
          error={errorMessage}
          subtitle="Remaining passes"
        />
        
        <StatsCard
          icon={DollarSign}
          title="Gross Revenue"
          value={stats?.totalRevenue ? `$${stats.totalRevenue}` : '$0.00'}
          change={0}
          loading={isLoading}
          error={errorMessage}
          subtitle="Before platform fees"
        />
      </div>
    </div>
  );
};

export default PassesOverview;