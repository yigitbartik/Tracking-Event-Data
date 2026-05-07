
import React, { useMemo } from 'react';
import { MatchEvent, MatchMetadata, Player, TeamRole } from '../types';
import { ArrowLeft, BarChart2, Map as MapIcon, Activity } from 'lucide-react';

interface AdvancedAnalysisProps {
    metadata: MatchMetadata;
    events: MatchEvent[];
    players: Player[];
    onBack: () => void;
}

const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ metadata, events, players, onBack }) => {
    
    // --- CALCULATIONS ---
    
    // 1. Pass Matrix / Count
    const passStats = useMemo(() => {
        const stats: Record<string, { successful: number, failed: number, total: number }> = {};
        events.filter(e => e.typeId === 1).forEach(e => {
            if (!stats[e.playerName]) stats[e.playerName] = { successful: 0, failed: 0, total: 0 };
            stats[e.playerName].total++;
            if (e.outcome === 1) stats[e.playerName].successful++;
            else stats[e.playerName].failed++;
        });
        return Object.entries(stats).sort((a,b) => b[1].total - a[1].total).slice(0, 10);
    }, [events]);

    // 2. Shot Locations (Simplified)
    const shots = useMemo(() => events.filter(e => [13,14,15,16].includes(e.typeId)), [events]);

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center gap-4 sticky top-0 z-20">
                <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-white">Advanced Match Analysis</h2>
                    <div className="text-xs text-gray-500">{metadata.homeTeamName} vs {metadata.awayTeamName}</div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
                
                {/* TOP PASSERS CHART */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-2">
                        <Activity size={18} className="text-blue-500" />
                        <h3 className="font-bold text-gray-200">Top Passers (Success Rate)</h3>
                    </div>
                    <div className="space-y-4">
                        {passStats.map(([name, stat]) => {
                             const successRate = (stat.successful / stat.total) * 100;
                             return (
                                <div key={name}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-bold text-gray-300">{name}</span>
                                        <span className="text-gray-500">{stat.successful}/{stat.total} ({successRate.toFixed(0)}%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                                        <div style={{ width: `${successRate}%` }} className="bg-green-500 h-full" />
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                </div>

                {/* SHOT MAP */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-2">
                         <MapIcon size={18} className="text-red-500" />
                         <h3 className="font-bold text-gray-200">Shot Map</h3>
                    </div>
                    
                    <div className="relative aspect-[105/68] bg-green-900/20 border border-white/10 rounded-lg mx-auto w-full max-w-md">
                        {/* Pitch Outline */}
                        <div className="absolute inset-0 border-2 border-white/20 rounded"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10"></div>
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10"></div>

                        {shots.map(s => {
                            // Normalize -52.5 to 52.5 -> 0 to 100%
                            const left = ((s.x + 52.5) / 105) * 100;
                            const top = ((34 - s.y) / 68) * 100;
                            const color = s.typeId === 16 ? 'bg-yellow-400' : (s.outcome === 1 ? 'bg-blue-500' : 'bg-red-500');
                            
                            return (
                                <div 
                                    key={s.id}
                                    className={`absolute w-3 h-3 rounded-full border border-black ${color} -translate-x-1/2 -translate-y-1/2 hover:scale-150 transition-transform cursor-pointer`}
                                    style={{ left: `${left}%`, top: `${top}%` }}
                                    title={`${s.playerName} - ${s.description}`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex gap-4 justify-center mt-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Goal</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> On Target</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Miss/Blocked</div>
                    </div>
                </div>

                {/* EVENT TYPE BREAKDOWN TABLE */}
                 <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-lg lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
                         <BarChart2 size={18} className="text-purple-500" />
                         <h3 className="font-bold text-gray-200">Key Event Breakdown</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Goals", count: events.filter(e => e.typeId === 16).length },
                            { label: "Shots", count: events.filter(e => [13,14,15].includes(e.typeId)).length },
                            { label: "Fouls", count: events.filter(e => e.typeId === 4).length },
                            { label: "Corners", count: events.filter(e => e.typeId === 6).length },
                            { label: "Tackles", count: events.filter(e => e.typeId === 7).length },
                            { label: "Interceptions", count: events.filter(e => e.typeId === 8).length },
                            { label: "Cards", count: events.filter(e => e.typeId === 17).length },
                            { label: "Subs", count: events.filter(e => [18,19].includes(e.typeId)).length },
                        ].map((item, i) => (
                            <div key={i} className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-white">{item.count}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AdvancedAnalysis;
