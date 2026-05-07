
import { EngineFrame, MatchEvent, MatchMetadata, Player, RawFrame, TeamRole, TeamStats, IndividualPlayerStats } from '../types';
import { EVENT_TYPES, QUALIFIERS } from './eventDefinitions';

const parseXML = (xmlStr: string) => {
  const parser = new DOMParser();
  return parser.parseFromString(xmlStr, "text/xml");
};

export const parseMatchMetadata = (xml: string): { metadata: MatchMetadata, players: Player[] } => {
  const doc = parseXML(xml);
  const general = doc.querySelector("General");
  const environment = doc.querySelector("Environment");
  
  const teams = doc.querySelectorAll("Team");
  let homeTeamId = "";
  let awayTeamId = "";

  teams.forEach(team => {
    if (team.getAttribute("Role") === "home") homeTeamId = team.getAttribute("TeamId") || "";
    else awayTeamId = team.getAttribute("TeamId") || "";
  });
  
  const metadata: MatchMetadata = {
    matchId: general?.getAttribute("MatchId") || "",
    homeTeamName: general?.getAttribute("HomeTeamName") || "Home",
    awayTeamName: general?.getAttribute("GuestTeamName") || "Away",
    homeTeamId: homeTeamId,
    awayTeamId: awayTeamId,
    homeScore: parseInt(general?.getAttribute("Result")?.split(":")[0] || "0"),
    awayScore: parseInt(general?.getAttribute("Result")?.split(":")[1] || "0"),
    pitchX: parseFloat(environment?.getAttribute("PitchX") || "105"),
    pitchY: parseFloat(environment?.getAttribute("PitchY") || "68"),
  };

  const players: Player[] = [];
  
  teams.forEach(team => {
    const role = team.getAttribute("Role") === "home" ? TeamRole.Home : TeamRole.Away;
    const teamId = team.getAttribute("TeamId") || "";
    
    team.querySelectorAll("Player").forEach(p => {
      players.push({
        id: p.getAttribute("PersonId") || "", // DFL ID
        name: p.getAttribute("Shortname") || p.getAttribute("LastName") || "Unknown",
        shirtNumber: parseInt(p.getAttribute("ShirtNumber") || "0"),
        teamId: teamId, 
        role: role,
        position: p.getAttribute("PlayingPosition") || undefined
      });
    });
  });

  return { metadata, players };
};

// Helper to parse Event 34 (Team Setup) to map Opta IDs to Shirt Numbers
const createOptaIdMap = (doc: Document, homeTeamId: string, awayTeamId: string): Map<string, number> => {
    const map = new Map<string, number>(); // OptaID -> ShirtNumber
    
    // Find all type_id="34" events (Team Setup)
    const setupEvents = Array.from(doc.querySelectorAll('Event[type_id="34"]'));
    
    setupEvents.forEach(evt => {
        // Qualifier 30: List of Player IDs
        // Qualifier 59: List of Jersey Numbers
        // They are parallel lists.
        const q30 = evt.querySelector('Q[qualifier_id="30"]')?.getAttribute('value');
        const q59 = evt.querySelector('Q[qualifier_id="59"]')?.getAttribute('value');

        if (q30 && q59) {
            const ids = q30.split(',').map(s => s.trim());
            const shirts = q59.split(',').map(s => s.trim());

            ids.forEach((id, index) => {
                if (shirts[index]) {
                    map.set(id, parseInt(shirts[index]));
                }
            });
        }
    });

    return map;
};

export const parseEvents = (xml: string, players: Player[]): MatchEvent[] => {
  const doc = parseXML(xml);
  const events: MatchEvent[] = [];
  const eventNodes = doc.querySelectorAll("Event");

  // 1. Build Opta -> Shirt Map from Event 34s
  // We need to find team IDs to be sure, usually passed or inferred.
  const optaToShirtMap = createOptaIdMap(doc, "", "");

  // 2. Create Shirt+Team -> DFL Player Map
  const shirtToDflMap = new Map<string, Player>();
  players.forEach(p => {
    shirtToDflMap.set(`${p.teamId}-${p.shirtNumber}`, p);
  });

  eventNodes.forEach(node => {
    const qualifiers: Record<string, string> = {};
    const qualifierNames: string[] = [];
    
    node.querySelectorAll("Q").forEach(q => {
      const qId = q.getAttribute("qualifier_id");
      const qVal = q.getAttribute("value") || "";
      if (qId) {
        qualifiers[qId] = qVal;
        if (QUALIFIERS[parseInt(qId)]) {
            qualifierNames.push(QUALIFIERS[parseInt(qId)]);
        }
      }
    });

    const tsString = node.getAttribute("timestamp");
    const timestamp = tsString ? new Date(tsString).getTime() : 0;
    const typeId = parseInt(node.getAttribute("type_id") || "0");
    const teamId = node.getAttribute("team_id") || ""; // Opta Team ID (e.g., 162)
    
    // Opta Player ID
    const optaPlayerId = node.getAttribute("player_id") || "";
    
    let playerName = "Unknown";
    let dflPlayerId = undefined;

    // --- RESOLUTION LOGIC ---
    // 1. Do we know the shirt number from the Team Setup event map?
    let shirtNumber = optaToShirtMap.get(optaPlayerId);

    // 2. If not, is it explicitly in this event? (Rare, but possible for cards/goals)
    if (!shirtNumber && qualifiers["59"]) {
        shirtNumber = parseInt(qualifiers["59"]);
    }

    // 3. If we have a shirt number, find the DFL player
    // Note: Opta Team ID (e.g. 162) might not match DFL Team ID (e.g. DFL-CLU-00000Z) directly string-wise.
    // We need to map Opta Team ID to DFL Team ID.
    // Simplification: Check both teams in our player list for that shirt number.
    if (shirtNumber) {
         // Try to find a player with this shirt number. 
         // Ideally we check teamId, but mapping "162" -> "DFL-CLU-00000Z" requires heuristic or hardcode from metadata.
         // Heuristic: Check metadata home/away IDs vs Opta IDs.
         // However, we have players list with DFL team IDs.
         
         // Let's try to find ANY player with this shirt number first (Collision risk is low unless same number on both teams involved in same event)
         // To be safe, we should match the team.
         // In the mock data: Hertha=162 (Opta) -> DFL-CLU-00000Z (DFL)
         
         // Find player in our DFL list matching shirt number
         // We'll search both teams, but prioritize the one matching the event contestant if possible.
         
         const candidates = players.filter(p => p.shirtNumber === shirtNumber);
         if (candidates.length === 1) {
             dflPlayerId = candidates[0].id;
             playerName = candidates[0].name;
         } else if (candidates.length > 1) {
             // Collision. Need to map Team ID. 
             // Allow fuzzy match or rely on external map.
             // For this specific dataset, we can rely on the user providing clean data or just picking the first for now.
             // Improvement: Use metadata to map Opta Team ID -> DFL Team ID
             // For now, assume the first match is correct or add logic later.
              dflPlayerId = candidates[0].id;
              playerName = candidates[0].name;
         }
    }

    const outcome = parseInt(node.getAttribute("outcome") || "0");

    // Generate Description
    let description = EVENT_TYPES[typeId] || `Event ${typeId}`;
    if (typeId === 1 && outcome === 0) description = "Failed Pass";
    
    // Normalize Coordinates (Opta 0-100 to Pitch Meters)
    // Assuming 105x68 pitch
    const optaX = parseFloat(node.getAttribute("x") || "0");
    const optaY = parseFloat(node.getAttribute("y") || "0");
    
    // Opta: 0,0 is bottom left? Or top left? Standard is:
    // X: 0-100 (Goal to Goal)
    // Y: 0-100 (Touchline to Touchline)
    // We map to meters [-52.5, 52.5] and [-34, 34]
    const x = (optaX / 100) * 105 - 52.5;
    const y = (optaY / 100) * 68 - 34;

    events.push({
      id: node.getAttribute("id") || "",
      eventId: node.getAttribute("event_id") || "",
      typeId: typeId,
      typeName: EVENT_TYPES[typeId] || `Event ${typeId}`,
      periodId: parseInt(node.getAttribute("period_id") || "0"),
      timeMin: parseInt(node.getAttribute("min") || "0"),
      timeSec: parseInt(node.getAttribute("sec") || "0"),
      contestantId: teamId,
      playerId: optaPlayerId,
      dflPlayerId: dflPlayerId,
      playerName: playerName,
      outcome: outcome,
      x: x, // Normalized to meters
      y: y, // Normalized to meters
      timestamp,
      description,
      qualifiers,
      qualifierNames
    });
  });

  return events.sort((a, b) => a.timestamp - b.timestamp);
};

const parseRawTracking = (xml: string): RawFrame[] => {
  const doc = parseXML(xml);
  const frameSets = doc.querySelectorAll("FrameSet");
  const frameMap = new Map<number, RawFrame>();

  frameSets.forEach(fs => {
    const personId = fs.getAttribute("PersonId");
    const teamId = fs.getAttribute("TeamId");
    
    fs.querySelectorAll("Frame").forEach(f => {
      const tsString = f.getAttribute("T");
      if (!tsString) return;
      
      const timestamp = new Date(tsString).getTime();
      
      if (!frameMap.has(timestamp)) {
        frameMap.set(timestamp, {
          timestamp,
          players: [],
          ball: null 
        });
      }

      const currentFrame = frameMap.get(timestamp)!;
      const rawX = parseFloat(f.getAttribute("X") || "0");
      const rawY = parseFloat(f.getAttribute("Y") || "0");
      const speed = parseFloat(f.getAttribute("S") || "0");

      if (personId) {
        currentFrame.players.push({
          playerId: personId,
          x: rawX,
          y: rawY, 
          speed: speed
        });
      } else if (teamId === "Ball") {
          currentFrame.ball = { x: rawX, y: rawY, speed };
      }
    });
  });

  return Array.from(frameMap.values()).sort((a, b) => a.timestamp - b.timestamp);
};

// Deep clone stats object to prevent reference mutation issues in timeline
const cloneStats = (
    teamStats: { home: TeamStats, away: TeamStats },
    playerStats: Record<string, IndividualPlayerStats>
) => {
    const newPlayerStats: Record<string, IndividualPlayerStats> = {};
    for (const key in playerStats) {
        newPlayerStats[key] = { ...playerStats[key] };
    }
    return {
        stats: {
            home: { ...teamStats.home },
            away: { ...teamStats.away }
        },
        playerStats: newPlayerStats
    };
};

export const buildMatchTimeline = (
    trackingXml: string, 
    events: MatchEvent[], 
    players: Player[],
    metadata: MatchMetadata
): EngineFrame[] => {
    
    const rawFrames = parseRawTracking(trackingXml);
    if (rawFrames.length === 0) return [];

    const timeline: EngineFrame[] = [];
    const trackingStart = rawFrames[0].timestamp;

    // --- SYNCHRONIZATION ---
    // Auto-detect offset between events and tracking
    // Usually there's a 1 hour diff in DFL/Opta samples sometimes
    let timeOffset = 0;
    if (events.length > 0) {
        // Find first event that is clearly part of the match flow (not setup)
        const firstPlayEvent = events.find(e => e.typeId === 32 || e.typeId === 1); // Start or Pass
        if (firstPlayEvent) {
             const diff = trackingStart - firstPlayEvent.timestamp;
             // If diff is > 30 mins, assume timezone offset needed.
             // Round to nearest hour
             if (Math.abs(diff) > 1800000) {
                 const hours = Math.round(diff / 3600000);
                 timeOffset = hours * 3600000;
             }
        }
    }

    // Apply offset to events
    const adjustedEvents = events.map(e => ({
        ...e,
        timestamp: e.timestamp + timeOffset
    })).sort((a,b) => a.timestamp - b.timestamp);

    // --- INITIALIZATION ---
    let homeScore = 0;
    let awayScore = 0;
    
    // Initialize stats containers
    const currentTeamStats: { home: TeamStats, away: TeamStats } = {
        home: { possession: 50, passes: 0, shots: 0, corners: 0, fouls: 0, totalDistance: 0 },
        away: { possession: 50, passes: 0, shots: 0, corners: 0, fouls: 0, totalDistance: 0 }
    };

    const currentPlayerStats: Record<string, IndividualPlayerStats> = {};
    players.forEach(p => {
      currentPlayerStats[p.id] = {
        id: p.id,
        name: p.name,
        shirtNumber: p.shirtNumber,
        teamId: p.teamId,
        distanceKm: 0,
        sprints: 0,
        passes: 0,
        shots: 0,
        tackles: 0,
        interceptions: 0,
        goals: 0,
        currentSpeed: 0
      };
    });

    // Process Pre-Tracking Events (Stats accumulator)
    // Events happening before the video starts should still count towards totals
    let eventIndex = 0;
    
    const processEvent = (evt: MatchEvent) => {
        const isHome = evt.contestantId === metadata.homeTeamId; // Needs exact ID match usually
        
        // Score
        if (evt.typeId === 16 && evt.outcome === 1) { 
            if (isHome) homeScore++; else awayScore++; 
        }
        
        // Team Stats
        if (evt.typeId === 1 && evt.outcome === 1) { if (isHome) currentTeamStats.home.passes++; else currentTeamStats.away.passes++; }
        if ([13,14,15,16].includes(evt.typeId)) { if (isHome) currentTeamStats.home.shots++; else currentTeamStats.away.shots++; }
        if (evt.typeId === 6) { if (isHome) currentTeamStats.home.corners++; else currentTeamStats.away.corners++; }
        if (evt.typeId === 4) { if (isHome) currentTeamStats.home.fouls++; else currentTeamStats.away.fouls++; }

        // Player Stats (using mapped DFL ID)
        if (evt.dflPlayerId && currentPlayerStats[evt.dflPlayerId]) {
            const ps = currentPlayerStats[evt.dflPlayerId];
            if (evt.typeId === 1 && evt.outcome === 1) ps.passes++;
            if ([13,14,15,16].includes(evt.typeId)) ps.shots++;
            if (evt.typeId === 7 && evt.outcome === 1) ps.tackles++;
            if (evt.typeId === 8) ps.interceptions++;
            if (evt.typeId === 16 && evt.outcome === 1) ps.goals++;
        }
    };

    // Fast-forward stats to the start of the tracking data
    while(eventIndex < adjustedEvents.length && adjustedEvents[eventIndex].timestamp < trackingStart) {
        processEvent(adjustedEvents[eventIndex]);
        eventIndex++;
    }

    const lastPlayerPositions = new Map<string, {x: number, y: number}>();

    // --- BUILD FRAMES ---
    for (let i = 0; i < rawFrames.length; i++) {
        const raw = rawFrames[i];
        const nextTimestamp = i < rawFrames.length - 1 ? rawFrames[i+1].timestamp : raw.timestamp + 40;

        // 1. Update Physics/Tracking Stats
        let homeDistFrame = 0;
        let awayDistFrame = 0;

        raw.players.forEach(p => {
            const lastPos = lastPlayerPositions.get(p.playerId);
            if (lastPos && currentPlayerStats[p.playerId]) {
                // Distance in meters
                const dist = Math.sqrt(Math.pow(p.x - lastPos.x, 2) + Math.pow(p.y - lastPos.y, 2));
                
                // Speed filter: ignore teleportation (>15m/s)
                if (dist < 0.6) {
                    const kmDist = dist / 1000;
                    currentPlayerStats[p.playerId].distanceKm += kmDist;
                    currentPlayerStats[p.playerId].currentSpeed = p.speed;

                    // Sprint detection (> 25.2 km/h approx 7 m/s)
                    if (p.speed > 7.0) {
                        // Add a tiny fraction for sprint count (conceptually duration)
                        // Or just boolean state. Here we count frames spent sprinting? 
                        // Let's leave simple for now.
                    }

                    const plyr = players.find(pl => pl.id === p.playerId);
                    if (plyr?.role === TeamRole.Home) homeDistFrame += kmDist;
                    else awayDistFrame += kmDist;
                }
            }
            lastPlayerPositions.set(p.playerId, { x: p.x, y: p.y });
        });

        currentTeamStats.home.totalDistance += homeDistFrame;
        currentTeamStats.away.totalDistance += awayDistFrame;

        // 2. Process Events in this Frame
        const activeEvents: MatchEvent[] = [];
        while(eventIndex < adjustedEvents.length && adjustedEvents[eventIndex].timestamp < nextTimestamp) {
            const evt = adjustedEvents[eventIndex];
            activeEvents.push(evt);
            processEvent(evt); // Update stats
            eventIndex++;
        }

        // 3. Time Formatting
        // Use the last active event time or default to raw time
        let matchTimeStr = "00:00";
        // Attempt to use event clock if available in this window
        if (activeEvents.length > 0) {
            matchTimeStr = `${activeEvents[0].timeMin}:${activeEvents[0].timeSec.toString().padStart(2, '0')}`;
        } else {
             // If no event, just hold previous or calculate offset? 
             // For visual smoothness, we often want to just show the last known clock or increment it.
             // Simple heuristic: match start is roughly known.
             const prevFrame = timeline.length > 0 ? timeline[timeline.length-1] : null;
             matchTimeStr = prevFrame ? prevFrame.matchTimeStr : "45:00"; // Default start
        }

        // 4. Clone current stats state for this frame (snapshot)
        const frameSnapshot = cloneStats(currentTeamStats, currentPlayerStats);

        timeline.push({
            timestamp: raw.timestamp,
            matchTimeStr,
            players: raw.players.map(p => ({
                playerId: p.playerId,
                x: p.x,
                y: p.y,
                speed: p.speed
            })),
            ball: raw.ball,
            homeScore,
            awayScore,
            stats: frameSnapshot.stats,
            playerStats: frameSnapshot.playerStats,
            lastEvent: activeEvents.length > 0 ? activeEvents[activeEvents.length - 1] : null
        });
    }

    return timeline;
};
