import React from 'react';
import { EngineFrame, MatchMetadata, TeamRole, PlayerMap } from '../types';

interface PitchProps {
  currentFrame: EngineFrame | undefined;
  metadata: MatchMetadata;
  playerMap: PlayerMap;
}

const StaticPitchLines = React.memo(() => (
  <div className="absolute inset-0 select-none pointer-events-none">
    <svg width="100%" height="100%" viewBox="0 0 105 68" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grass" x="0" y="0" width="5.25" height="68" patternUnits="userSpaceOnUse">
            <rect width="2.625" height="68" fill="#347d4e" />
            <rect x="2.625" width="2.625" height="68" fill="#2e7346" />
        </pattern>
      </defs>
      <rect width="105" height="68" fill="url(#grass)" />
      <g stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" fill="none">
          <rect x="0" y="0" width="105" height="68" />
          <line x1="52.5" y1="0" x2="52.5" y2="68" />
          <circle cx="52.5" cy="34" r="9.15" />
          <circle cx="52.5" cy="34" r="0.4" fill="white" />
          <rect x="0" y="13.84" width="16.5" height="40.32" />
          <rect x="0" y="24.84" width="5.5" height="18.32" />
          <circle cx="11" cy="34" r="0.3" fill="white" />
          <rect x="88.5" y="13.84" width="16.5" height="40.32" />
          <rect x="100" y="24.84" width="5.0" height="18.32" />
          <circle cx="94" cy="34" r="0.3" fill="white" />
          <path d="M 0 1 A 1 1 0 0 0 1 0" />
          <path d="M 0 67 A 1 1 0 0 1 1 68" />
          <path d="M 105 1 A 1 1 0 0 1 104 0" />
          <path d="M 105 67 A 1 1 0 0 0 104 68" />
      </g>
    </svg>
  </div>
));

const FootballPitch: React.FC<PitchProps> = ({ currentFrame, playerMap }) => {
  
  const getStyle = (x: number, y: number) => {
      // Map coordinates: X [-52.5, 52.5] -> [0, 100], Y [-34, 34] -> [100, 0]
      const left = ((x + 52.5) / 105) * 100;
      const top = ((34 - y) / 68) * 100;
      return {
          left: `${left}%`,
          top: `${top}%`,
          transform: 'translate(-50%, -50%) translateZ(0)' // Force GPU
      };
  };

  const getPlayerColor = (pid: string): string => {
    const p = playerMap[pid];
    if (!p) return '#9ca3af'; 
    return p.role === TeamRole.Home ? '#3b82f6' : '#ef4444'; 
  };

  const getPlayerNumber = (pid: string) => {
      return playerMap[pid]?.shirtNumber || '';
  }

  return (
    <div className="relative w-full h-full bg-green-800 overflow-hidden shadow-xl select-none rounded">
        <StaticPitchLines />

        {/* Live Event Pop-up */}
        {currentFrame?.lastEvent && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-pulse">
                <div className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                    {currentFrame.lastEvent.description}
                </div>
            </div>
        )}

        {/* Players Layer */}
        <div className="absolute inset-0 z-10">
            {currentFrame?.players.map((p) => (
                <div
                    key={p.playerId}
                    className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-white/90 flex items-center justify-center shadow-sm will-change-transform transition-all duration-75 ease-linear"
                    style={{
                        ...getStyle(p.x, p.y),
                        backgroundColor: getPlayerColor(p.playerId)
                    }}
                >
                    <span className="text-[6px] sm:text-[8px] font-bold text-white">
                        {getPlayerNumber(p.playerId)}
                    </span>
                </div>
            ))}
        </div>

        {/* Ball Layer */}
        {currentFrame?.ball && (
            <div
                className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full border border-black z-20 will-change-transform transition-all duration-75 ease-linear shadow-sm"
                style={getStyle(currentFrame.ball.x, currentFrame.ball.y)}
            />
        )}
        
        <div className="absolute bottom-2 left-2 text-[10px] text-white/50 font-mono">
            LIVE TRACKING
        </div>
    </div>
  );
};

export default React.memo(FootballPitch);