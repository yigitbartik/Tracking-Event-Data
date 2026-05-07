
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MatchEvent, Player } from '../types';

interface EventFeedProps {
  events: MatchEvent[];
  currentTime: number;
  onEventClick: (timestamp: number) => void;
}

const EventFeed: React.FC<EventFeedProps> = ({ events, currentTime, onEventClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'goals' | 'shots' | 'cards'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);

  const ITEM_HEIGHT = 86; // approximate item height depending on content, usually ~80-100
  const CONTAINER_HEIGHT = 600;

  const getEventColor = (typeId: number, outcome: number) => {
      if (typeId === 16) return 'border-l-4 border-l-yellow-500 bg-yellow-900/10'; 
      if (typeId === 17) return 'border-l-4 border-l-red-500 bg-red-900/10'; 
      if ([13,14,15].includes(typeId)) return 'border-l-4 border-l-purple-500 bg-purple-900/10'; 
      if (outcome === 0) return 'border-l-2 border-l-red-800/50 text-gray-500'; 
      return 'border-l-2 border-l-blue-600/50'; 
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
        if (filter === 'all') return true;
        if (filter === 'goals') return e.typeId === 16;
        if (filter === 'shots') return [13,14,15,16].includes(e.typeId);
        if (filter === 'cards') return e.typeId === 17;
        return true;
    });
  }, [events, filter]);

  const activeIndex = useMemo(() => {
    const idx = filteredEvents.findIndex(e => e.timestamp > currentTime);
    return idx === -1 ? filteredEvents.length : idx;
  }, [currentTime, filteredEvents]);

  useEffect(() => {
    if (filter !== 'all' || !autoScroll) return;
    
    if (activeIndex > 0 && containerRef.current) {
        // Auto scroll
        const targetScroll = Math.max(0, (activeIndex - 1) * ITEM_HEIGHT - CONTAINER_HEIGHT / 2);
        containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [activeIndex, filter, autoScroll]);

  // Handle scroll event for virtualization
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
  };

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 5);
  const endIndex = Math.min(filteredEvents.length, startIndex + Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + 10);
  const visibleEvents = filteredEvents.slice(startIndex, endIndex);

  return (
    <div className="bg-gray-900 border-l border-gray-800 h-full flex flex-col w-full">
      <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-900 shadow-sm z-10 shrink-0">
        <span className="font-bold text-gray-200 text-xs uppercase tracking-wide">Match Events</span>
        <div className="flex gap-1 flex-wrap justify-end">
            {['all', 'goals', 'shots', 'cards'].map(f => (
                <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-2 py-1 text-[9px] uppercase font-bold rounded transition-all ${filter === f ? 'bg-blue-600 text-white shadow' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 w-full relative overflow-y-auto overflow-x-hidden scrollbar-thin"
        onScroll={handleScroll}
        onWheel={() => setAutoScroll(false)} 
        onTouchMove={() => setAutoScroll(false)}
        onMouseLeave={() => setAutoScroll(true)}
      >
        {filteredEvents.length > 0 ? (
            <div style={{ height: `${filteredEvents.length * ITEM_HEIGHT}px`, position: 'relative' }}>
                {visibleEvents.map((evt, idx) => {
                    const actualIndex = startIndex + idx;
                    const isPast = evt.timestamp <= currentTime;
                    const isActive = Math.abs(evt.timestamp - currentTime) < 2000; 

                    return (
                        <div 
                        key={evt.id}
                        data-active={isActive ? "true" : "false"}
                        onClick={() => onEventClick(evt.timestamp)}
                        style={{ position: 'absolute', top: `${actualIndex * ITEM_HEIGHT}px`, width: '100%', height: `${ITEM_HEIGHT}px` }}
                        className={`
                            p-3 border-b border-gray-800 transition-all duration-200 cursor-pointer group
                            ${getEventColor(evt.typeId, evt.outcome)}
                            ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800/50'}
                            ${!isPast && !isActive ? 'opacity-60' : 'opacity-100'}
                        `}
                        >
                        <div className="flex justify-between items-start mb-1 gap-2">
                            <div className="flex items-center gap-2 overflow-hidden truncate">
                                <span className="font-mono text-xs font-bold text-blue-400">
                                {evt.timeMin}'
                                </span>
                                <span className="text-[10px] font-bold uppercase text-gray-300 truncate">
                                    {evt.typeName}
                                </span>
                            </div>
                            {evt.outcome === 0 && (
                                <span className="text-[9px] text-red-500 font-bold uppercase">Failed</span>
                            )}
                        </div>
                        
                        <div className="text-xs text-gray-100 font-medium pl-1 truncate">
                            {evt.playerName !== "Unknown" ? evt.playerName : <span className="text-gray-500 italic">Unknown Player</span>}
                        </div>
                        
                        <div className="flex gap-1 mt-1 pl-1 overflow-hidden">
                            {evt.qualifierNames.length > 0 ? (
                                evt.qualifierNames.slice(0, 3).map((q, i) => (
                                    <span key={i} className="text-[9px] text-gray-400 bg-gray-800/80 border border-gray-700 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                        {q}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[9px] text-gray-600 italic">No details</span>
                            )}
                        </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="p-10 text-center text-gray-600 text-xs uppercase tracking-widest">
                No events found
            </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EventFeed);
