
export enum TeamRole {
  Home = 'home',
  Away = 'guest'
}

export type ViewState = 'live' | 'advanced';

export interface Player {
  id: string; // DFL ID (e.g., DFL-OBJ-0002LD)
  optaId?: string; // Mapped Opta ID (e.g., 18695)
  name: string;
  shirtNumber: number;
  teamId: string;
  role: TeamRole;
  position?: string;
}

export type PlayerMap = Record<string, Player>;

export interface BallPosition {
  x: number;
  y: number;
  speed: number;
}

export interface PlayerPosition {
  playerId: string;
  x: number; // Meters
  y: number; // Meters
  speed: number; // m/s
}

export interface IndividualPlayerStats {
  id: string; // DFL ID
  name: string;
  shirtNumber: number;
  teamId: string;
  distanceKm: number;
  sprints: number; // Speed > 7 m/s
  passes: number;
  shots: number;
  tackles: number;
  interceptions: number;
  goals: number;
  currentSpeed: number;
}

export interface EngineFrame {
  timestamp: number;
  matchTimeStr: string; // "45:02"
  players: PlayerPosition[];
  ball: BallPosition | null;
  
  // Instant Stats at this exact frame
  homeScore: number;
  awayScore: number;
  stats: {
    home: TeamStats;
    away: TeamStats;
  };
  playerStats: Record<string, IndividualPlayerStats>; 
  lastEvent: MatchEvent | null;
}

export interface TeamStats {
  possession: number;
  passes: number;
  shots: number;
  corners: number;
  fouls: number;
  totalDistance: number; 
}

export interface MatchEvent {
  id: string;
  eventId: string;
  typeId: number;
  typeName: string;
  periodId: number;
  timeMin: number;
  timeSec: number;
  contestantId: string;
  playerId: string; // Opta ID
  dflPlayerId?: string; // Mapped DFL ID
  playerName: string; // Resolved Name
  outcome: number;
  x: number;
  y: number;
  timestamp: number;
  description: string;
  qualifiers: Record<string, string>;
  qualifierNames: string[];
}

export interface MatchMetadata {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  pitchX: number;
  pitchY: number;
}

export interface RawFrame {
  timestamp: number;
  players: {
    playerId: string;
    x: number;
    y: number;
    speed: number;
  }[];
  ball: {
    x: number;
    y: number;
    speed: number;
  } | null;
}
