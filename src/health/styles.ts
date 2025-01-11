export const styles = {
  container: "max-w-7xl mx-auto p-8 space-y-8",
  header: {
    wrapper: "flex justify-between items-center",
    title: "text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent",
    subtitle: "text-gray-400 mt-2",
  },
  refreshButton: (isRefreshing: boolean) => 
    `p-2 rounded-lg hover:bg-gray-800/50 transition-colors ${isRefreshing ? 'opacity-50' : ''}`,
  grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  card: "p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm",
  cardTitle: "text-lg font-medium text-white mb-4 flex items-center gap-2",
  cardIcon: "w-5 h-5 text-[#fa7517]",
  metric: {
    container: "p-4 rounded-lg bg-gray-900/50",
    label: "text-sm text-gray-400",
    value: "text-2xl font-semibold text-white",
  },
  statusIndicator: (isHealthy: boolean) => 
    `flex items-center gap-2 ${isHealthy ? 'text-green-400' : 'text-red-400'}`,
  error: "p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3",
  errorText: "text-sm text-red-200",
  loading: "flex items-center justify-center h-64",
};