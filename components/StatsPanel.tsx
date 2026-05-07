import React, { useState, useMemo, useEffect } from 'react';
import { EngineFrame, TeamRole, Player, IndividualPlayerStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronRight } from 'lucide-react';

interface StatsPanelProps {
  currentFrame: EngineFrame | undefined;
  players: Player[];
  onSwitchToAdvanced: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ currentFrame, players, onSwitchToAdvanced }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'players'>('team');
  const [sortField, setSortField] = useState<keyof IndividualPlayerStats>('distanceKm');
  
  const [throttledFrame, setThrottledFrame] = useState<EngineFrame | undefined>(currentFrame);

  // Throttle frame updates for StatsPanel to 2 fps to prevent UI lag
  useEffect(() => {
     if (!currentFrame) return;
     const currentTs = currentFrame.timestamp;
     const prevTs = throttledFrame?.timestamp || 0;
     if (Math.abs(currentTs - prevTs) > 500) {
         setThrottledFrame(currentFrame);
     }
  }, [currentFrame, throttledFrame]);

  if (!throttledFrame) return <div className="p-4 text-gray-500 text-center text-sm">Waiting for data...</div>;

  const { stats, playerStats } = throttledFrame;

  const getRole = (id: string) => players.find(p => p.id === id)?.role;

  const sortedPlayers = useMemo(() => {
      return Object.values(playerStats).sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
            return valB - valA;
        }
        return 0;
      });
  }, [playerStats, sortField]);

  const StatRow = ({ label, homeVal, awayVal, unit = '' }: { label: string, homeVal: number | string, awayVal: number | string, unit?: string }) => {
      const h = Number(homeVal);
      const a = Number(awayVal);
      const total = h + a;
      const hPerc = total > 0 ? (h / total) * 100 : 50;
      
      return (
        <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-semibold uppercase">
                <span>{typeof homeVal === 'number' ? homeVal.toFixed(0) : homeVal}{unit}</span>
                <span>{label}</span>
                <span>{typeof awayVal === 'number' ? awayVal.toFixed(0) : awayVal}{unit}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${hPerc}%` }} className="bg-blue-600 h-full transition-all duration-500" />
                <div style={{ width: `${100-hPerc}%` }} className="bg-red-600 h-full transition-all duration-500" />
            </div>
        </div>
      );
  };

  const PlayerTable = ({ role }: { role: TeamRole }) => {
      const teamPlayers = sortedPlayers.filter(ps => getRole(ps.id) === role);

      return (
          <table className="w-full text-left text-[10px] sm:text-xs border-collapse">
              <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="border-b border-gray-700 text-gray-500 font-mono">
                      <th className="py-2 pl-1 w-24">PLAYER</th>
                      <th className="py-2 text-right cursor-pointer hover:text-white" onClick={() => setSortField('distanceKm')}>DIST</th>
                      <th className="py-2 text-right cursor-pointer hover:text-white" onClick={() => setSortField('passes')}>PASS</th>
                      <th className="py-2 text-right cursor-pointer hover:text-white" onClick={() => setSortField('currentSpeed')}>SPD</th>
                  </tr>
              </thead>
              <tbody>
                  {teamPlayers.map(p => (
                      <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                          <td className="py-1.5 pl-1 truncate max-w-[90px] font-medium text-gray-300">
                              <span className="text-gray-500 mr-1 text-[9px]">{p.shirtNumber}</span> {p.name}
                          </td>
                          <td className="py-1.5 text-right font-mono text-blue-300">{p.distanceKm.toFixed(2)}km</td>
                          <td className="py-1.5 text-right text-gray-400">{p.passes}</td>
                          <td className="py-1.5 text-right text-gray-400">{p.currentSpeed.toFixed(1)}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
        {/* Header / Navigation */}
        <div className="p-4 border-b border-gray-800">
             <button 
                onClick={onSwitchToAdvanced}
                className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
             >
                Advanced Analysis <ChevronRight size={14} />
             </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
            <button 
                onClick={() => setActiveTab('team')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'team' ? 'text-white border-b-2 border-blue-500 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Team Stats
            </button>
            <button 
                onClick={() => setActiveTab('players')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'players' ? 'text-white border-b-2 border-blue-500 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Player Stats
            </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin p-4">
            {activeTab === 'team' ? (
                <div className="space-y-6">
                     <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                        <div className="text-center mb-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Total Distance Covered</div>
                        <div className="flex justify-between items-baseline">
                            <div className="text-blue-400 font-bold text-2xl">{stats.home.totalDistance.toFixed(2)} <span className="text-xs text-gray-500 font-normal">km</span></div>
                            <div className="text-red-400 font-bold text-2xl">{stats.away.totalDistance.toFixed(2)} <span className="text-xs text-gray-500 font-normal">km</span></div>
                        </div>
                        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden flex">
                             <div style={{ width: `${(stats.home.totalDistance / (stats.home.totalDistance + stats.away.totalDistance || 1)) * 100}%` }} className="bg-blue-500/80 h-full" />
                             <div style={{ width: `${(stats.away.totalDistance / (stats.home.totalDistance + stats.away.totalDistance || 1)) * 100}%` }} className="bg-red-500/80 h-full" />
                        </div>
                     </div>

                    <div className="space-y-1">
                        <StatRow label="Possession" homeVal={stats.home.possession} awayVal={stats.away.possession} unit="%" />
                        <StatRow label="Passes" homeVal={stats.home.passes} awayVal={stats.away.passes} />
                        <StatRow label="Shots" homeVal={stats.home.shots} awayVal={stats.away.shots} />
                        <StatRow label="Corners" homeVal={stats.home.corners} awayVal={stats.away.corners} />
                        <StatRow label="Fouls" homeVal={stats.home.fouls} awayVal={stats.away.fouls} />
                    </div>
                </div>
            ) : (
                <div className="space-y-8 pb-4">
                    <div>
                        <h4 className="text-xs font-bold text-blue-400 mb-2 uppercase border-b border-blue-900/50 pb-1 sticky top-0 bg-gray-900">Home Team</h4>
                        <PlayerTable role={TeamRole.Home} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-red-400 mb-2 uppercase border-b border-red-900/50 pb-1 sticky top-0 bg-gray-900">Away Team</h4>
                        <PlayerTable role={TeamRole.Away} />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default React.memo(StatsPanel);