
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';
import FootballPitch from './components/FootballPitch';
import EventFeed from './components/EventFeed';
import StatsPanel from './components/StatsPanel';
import FileUpload from './components/FileUpload';
import AdvancedAnalysis from './components/AdvancedAnalysis'; // New component
import { RAW_EVENTS_XML, RAW_MATCH_INFO_XML, RAW_TRACKING_XML } from './utils/rawData';
import { parseEvents, parseMatchMetadata, buildMatchTimeline } from './utils/dataParser';
import { MatchEvent, MatchMetadata, Player, PlayerMap, EngineFrame, ViewState } from './types';

function App() {
  // -- APP STATE --
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('live');

  // -- ENGINE DATA --
  const [metadata, setMetadata] = useState<MatchMetadata | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [timeline, setTimeline] = useState<EngineFrame[]>([]);
  
  const playerMap = useMemo<PlayerMap>(() => {
    return players.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
  }, [players]);

  // -- PLAYBACK STATE --
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timelineIndex, setTimelineIndex] = useState(0); 

  // -- ENGINE REFS --
  const requestRef = useRef<number>(0);
  const lastRealTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const currentFrame = timeline[timelineIndex] || null;
  const totalFrames = timeline.length;
  const currentTime = currentFrame?.timestamp || 0;

  // -- FULLSCREEN LOGIC --
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          dashboardRef.current?.requestFullscreen();
      } else {
          document.exitFullscreen();
      }
  };
  
  // -- DATA PROCESSING --
  const handleProcessData = useCallback((matchInfoXml: string, trackingXml: string, eventsXml: string) => {
    setIsProcessing(true);
    setTimeout(() => {
        try {
            console.time("EngineBuild");
            // 1. Parse Metadata & Players first (needed for ID mapping)
            const { metadata: meta, players: plyrs } = parseMatchMetadata(matchInfoXml);
            
            // 2. Parse Events, passing players to resolve "Unknown" names via Shirt Number
            const evts = parseEvents(eventsXml, plyrs);
            
            // 3. Build Timeline (Heavy lifting)
            const engineTimeline = buildMatchTimeline(trackingXml, evts, plyrs, meta);
            
            setMetadata(meta);
            setPlayers(plyrs);
            setEvents(evts);
            setTimeline(engineTimeline);
            
            console.timeEnd("EngineBuild");
            setHasLoadedData(true);
            setIsPlaying(true); 
        } catch (e) {
            console.error("Engine Failure", e);
            alert("Failed to initialize match engine. Check console for details.");
        } finally {
            setIsProcessing(false);
        }
    }, 100);
  }, []);

  const loadDemoData = () => {
      handleProcessData(RAW_MATCH_INFO_XML, RAW_TRACKING_XML, RAW_EVENTS_XML);
  };

  // -- GAME LOOP --
  const gameLoop = useCallback((time: number) => {
    if (lastRealTimeRef.current !== 0) {
        const delta = time - lastRealTimeRef.current;
        accumulatorRef.current += delta * playbackSpeed;
        const msPerFrame = 40; // 25Hz Tracking
        
        if (accumulatorRef.current >= msPerFrame) {
            const framesToAdvance = Math.floor(accumulatorRef.current / msPerFrame);
            accumulatorRef.current -= framesToAdvance * msPerFrame;
            
            setTimelineIndex(prev => {
                const next = prev + framesToAdvance;
                if (next >= totalFrames - 1) {
                    setIsPlaying(false);
                    return totalFrames - 1;
                }
                return next;
            });
        }
    }
    lastRealTimeRef.current = time;
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [totalFrames, playbackSpeed]);

  useEffect(() => {
    if (isPlaying && viewState === 'live') {
      lastRealTimeRef.current = performance.now();
      accumulatorRef.current = 0;
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastRealTimeRef.current = 0;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameLoop, viewState]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    const newIndex = Math.min(Math.floor((newVal / 100) * (totalFrames - 1)), totalFrames - 1);
    setTimelineIndex(newIndex);
  };

  const handleEventSeek = (targetTimestamp: number) => {
      if (timeline.length === 0) return;
      const index = timeline.findIndex(f => f.timestamp >= targetTimestamp);
      
      if (index !== -1) {
          // Jump slightly before event to see context
          setTimelineIndex(Math.max(0, index - 40)); 
          setIsPlaying(true);
      }
  };

  // -- RENDER --
  if (!hasLoadedData) {
      if (isProcessing) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white animate-pulse font-mono">Initializing Match Engine...</div>;
      return <FileUpload onUpload={handleProcessData} onDemoLoad={loadDemoData} />;
  }

  if (!metadata || !currentFrame) return null;

  // 1. ADVANCED ANALYSIS VIEW
  if (viewState === 'advanced') {
      return (
        <AdvancedAnalysis 
            metadata={metadata} 
            events={events} 
            players={players} 
            onBack={() => setViewState('live')} 
        />
      );
  }

  // 2. LIVE MATCH VIEW
  return (
    <div ref={dashboardRef} className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans overflow-hidden">
      
      {/* TOP BAR */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex justify-between items-center h-14 shrink-0 z-20">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <h1 className="text-sm font-bold text-gray-200 tracking-wide hidden sm:block">OPTA<span className="text-blue-500">TRACK</span></h1>
            <div className="h-4 w-px bg-gray-700 mx-2 hidden sm:block"/>
            <span className="text-xs text-gray-500 font-mono">{metadata.matchId}</span>
        </div>

        {/* CENTER SCOREBOARD */}
        <div className="flex items-center gap-4 px-6 py-1.5 bg-black/40 rounded-full border border-gray-800/60">
             <span className="text-right font-bold text-blue-400 w-24 text-xs sm:text-sm truncate">{metadata.homeTeamName}</span>
             <div className="bg-gray-800 px-3 py-0.5 rounded font-mono text-lg sm:text-xl font-bold text-white min-w-[60px] text-center border border-gray-700 shadow-inner">
                 {currentFrame.homeScore}-{currentFrame.awayScore}
             </div>
             <span className="text-left font-bold text-red-400 w-24 text-xs sm:text-sm truncate">{metadata.awayTeamName}</span>
        </div>

        <div className="flex items-center gap-3">
           <div className="text-right hidden sm:block mr-2">
               <div className="font-mono font-bold text-xl text-white leading-none">{currentFrame.matchTimeStr}</div>
           </div>
           <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors">
               {isFullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}
           </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <main className="flex-1 flex min-h-0 relative">
        
        {/* LEFT: STATS */}
        <div className={`${isFullscreen ? 'w-0 sm:w-72' : 'w-0 md:w-72'} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 overflow-hidden`}>
            <div className="flex-1 overflow-y-auto">
                <StatsPanel 
                    currentFrame={currentFrame} 
                    players={players} 
                    onSwitchToAdvanced={() => {
                        setIsPlaying(false);
                        setViewState('advanced');
                    }} 
                />
            </div>
        </div>

        {/* CENTER: PITCH */}
        <div className="flex-1 flex flex-col bg-gray-950 relative min-w-0">
             <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
                {/* Pitch Wrapper */}
                <div className="w-full max-w-5xl aspect-[105/68] relative shadow-2xl shadow-black rounded border border-gray-800/30 bg-gray-900">
                    <FootballPitch 
                        currentFrame={currentFrame}
                        metadata={metadata}
                        playerMap={playerMap}
                    />
                </div>
             </div>

             {/* Playback Controls */}
             <div className="h-16 bg-gray-900 border-t border-gray-800 px-4 sm:px-6 flex items-center gap-4 z-20">
                 <button 
                    onClick={() => setIsPlaying(!isPlaying)} 
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-lg transition-all active:scale-95 focus:outline-none"
                 >
                     {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5"/>}
                 </button>

                 <div className="flex-1 flex flex-col justify-center gap-1 group">
                     <input 
                        type="range" 
                        min="0" max="100" step="0.01"
                        value={(timelineIndex / totalFrames) * 100} 
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                     />
                 </div>

                 <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                    {[1, 2, 5].map(s => (
                        <button 
                            key={s} 
                            onClick={() => setPlaybackSpeed(s)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${playbackSpeed === s ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            {s}x
                        </button>
                    ))}
                 </div>
             </div>
        </div>

        {/* RIGHT: EVENTS */}
        <div className={`${isFullscreen ? 'w-64' : 'w-72'} bg-gray-900 border-l border-gray-800 flex flex-col transition-all duration-300 z-10`}>
             <EventFeed 
                events={events}
                currentTime={currentTime}
                onEventClick={handleEventSeek}
             />
        </div>

      </main>
    </div>
  );
}

export default App;
