
import { RawFrame, MatchEvent, MatchMetadata, TeamRole, Player } from '../types';

// Base timestamp for start of match (taken from XML: 2016-08-28T15:30:00)
// We will focus on the second half window provided in XML ~16:30
const BASE_TIME = new Date("2016-08-28T16:33:18").getTime();

export const matchMetadata: MatchMetadata = {
  matchId: "DFL-MAT-002780",
  homeTeamName: "Hertha BSC",
  awayTeamName: "SC Freiburg",
  homeTeamId: "162",
  awayTeamId: "160",
  homeScore: 2,
  awayScore: 1,
  pitchX: 105.0,
  pitchY: 68.0
};

export const players: Player[] = [
  // Hertha (Home - Blue)
  { id: "18695", name: "S. Kalou", shirtNumber: 8, teamId: "162", role: TeamRole.Home },
  { id: "102742", name: "M. Weiser", shirtNumber: 23, teamId: "162", role: TeamRole.Home },
  { id: "42614", name: "V. Ibisevic", shirtNumber: 19, teamId: "162", role: TeamRole.Home },
  { id: "45138", name: "G. Haraguchi", shirtNumber: 24, teamId: "162", role: TeamRole.Home },
  // Freiburg (Guest - Red)
  { id: "94196", name: "V. Grifo", shirtNumber: 32, teamId: "160", role: TeamRole.Away },
  { id: "119382", name: "N. Petersen", shirtNumber: 18, teamId: "160", role: TeamRole.Away },
  { id: "85515", name: "M. Philipp", shirtNumber: 26, teamId: "160", role: TeamRole.Away },
  { id: "DFL-OBJ-0000D9", name: "N. Höfler", shirtNumber: 27, teamId: "160", role: TeamRole.Away }, // ID from tracking
];

// Generate synthetic frames for visualization purposes
// In a real app, this comes from the DFL XML Parser
const generateFrames = (): RawFrame[] => {
  const frames: RawFrame[] = [];
  const durationSeconds = 60; // 1 minute clip
  const fps = 25;
  
  for (let i = 0; i < durationSeconds * fps; i++) {
    const timeOffset = i * 40; // 40ms per frame
    const t = i / fps;

    frames.push({
      timestamp: BASE_TIME + timeOffset,
      ball: {
        // Ball moves in a figure 8 pattern
        x: Math.sin(t * 0.5) * 30,
        y: Math.cos(t * 0.3) * 20,
        speed: 5
      },
      players: [
        // Simulate Hertha Players (Defending left side)
        { playerId: "18695", x: -20 + Math.sin(t * 0.1) * 5, y: 10 + Math.cos(t * 0.2) * 2, speed: 4 },
        { playerId: "102742", x: -25 + Math.cos(t * 0.1) * 3, y: -15 + Math.sin(t * 0.3) * 2, speed: 3 },
        { playerId: "42614", x: -10 + Math.sin(t * 0.05) * 10, y: 0 + Math.cos(t * 0.1) * 5, speed: 6 },
        
        // Simulate Freiburg Players (Attacking right side)
        // N. Hofler from XML snippet (Moving slightly)
        { playerId: "DFL-OBJ-0000D9", x: 9.19 + (i * 0.01), y: -3.46 + (Math.sin(i*0.1)*0.5), speed: 0.44 },
        { playerId: "94196", x: 15 + Math.sin(t * 0.2) * 8, y: 20 + Math.cos(t * 0.1) * 3, speed: 5.5 },
        { playerId: "119382", x: 30 + Math.cos(t * 0.15) * 4, y: -5 + Math.sin(t * 0.2) * 6, speed: 4.2 },
        { playerId: "85515", x: 25 + Math.sin(t * 0.3) * 2, y: 10 + Math.cos(t * 0.4) * 4, speed: 7.1 },
      ]
    });
  }
  return frames;
};

export const trackingData = generateFrames();

// Parsed from the Event XML snippet provided
export const matchEvents: MatchEvent[] = [
  {
    id: "1240378682",
    eventId: "1",
    typeId: 34,
    periodId: 16,
    timeMin: 0,
    timeSec: 0,
    contestantId: "160",
    playerId: "94196",
    playerName: "V. Grifo",
    outcome: 1,
    x: 50.0, // Center
    y: 50.0,
    timestamp: BASE_TIME + 1000, // Sync near start
    description: "Team Setup (Freiburg)",
    qualifiers: {},
    typeName: "Team Setup",
    qualifierNames: []
  },
  {
    id: "761609414",
    eventId: "55",
    typeId: 1, // Pass
    periodId: 2,
    timeMin: 45,
    timeSec: 0,
    contestantId: "162", // Hertha
    playerId: "18695", // Kalou
    playerName: "S. Kalou",
    outcome: 1,
    x: 49.3,
    y: 51.1,
    timestamp: BASE_TIME + 5000,
    description: "Pass",
    qualifiers: { "140": "40.9", "141": "60.8" }, // End Coordinates
    typeName: "Pass",
    qualifierNames: []
  },
  {
    id: "1845948227",
    eventId: "56",
    typeId: 1, // Pass
    periodId: 2,
    timeMin: 45,
    timeSec: 2,
    contestantId: "162",
    playerId: "102742", // Weiser
    playerName: "M. Weiser",
    outcome: 1,
    x: 40.5,
    y: 53.9,
    timestamp: BASE_TIME + 8000,
    description: "Pass",
    qualifiers: {},
    typeName: "Pass",
    qualifierNames: []
  },
  {
     id: "476597210",
     eventId: "57",
     typeId: 1,
     periodId: 2,
     timeMin: 45,
     timeSec: 5,
     contestantId: "162",
     playerId: "42614", // Ibisevic
     playerName: "V. Ibisevic",
     outcome: 0, // Failed
     x: 47.0,
     y: 5.2,
     timestamp: BASE_TIME + 12000,
     description: "Pass (Failed)",
     qualifiers: {},
     typeName: "Pass",
     qualifierNames: []
  },
  {
    id: "123123123", // Synthetic Shot
    eventId: "58",
    typeId: 13, // Shot
    periodId: 2,
    timeMin: 45,
    timeSec: 15,
    contestantId: "160",
    playerId: "85515", // Philipp
    playerName: "M. Philipp",
    outcome: 1,
    x: 85.0,
    y: 50.0,
    timestamp: BASE_TIME + 22000,
    description: "Shot on Target",
    qualifiers: {},
    typeName: "Miss",
    qualifierNames: []
  }
];
