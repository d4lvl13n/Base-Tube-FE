import React from 'react';
import { Users } from 'lucide-react';

interface TopChannelData {
  id: string;
  name: string;
  interactionCount: number;
}

interface TopChannelsTableProps {
  channels?: TopChannelData[];
  loading?: boolean;
}

export const TopChannelsTable: React.FC<TopChannelsTableProps> = ({ channels = [], loading = false }) => {
  if (loading) {
    return <div className="animate-pulse bg-black/50 rounded-xl p-4 h-48" />;
  }

  return (
    <div className="bg-black/50 rounded-xl p-4">
      <table className="w-full">
        <thead>
          <tr className="text-gray-400 text-sm">
            <th className="text-left py-2">Channel</th>
            <th className="text-right py-2"><Users className="w-4 h-4 inline" /> Interactions</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <tr key={channel.id} className="border-t border-gray-800">
              <td className="py-3 truncate max-w-[200px]">{channel.name}</td>
              <td className="text-right text-[#fa7517]">
                {channel.interactionCount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};