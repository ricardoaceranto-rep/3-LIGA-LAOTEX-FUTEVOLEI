export interface MatchScore {
  h: string;
  a: string;
}

export interface GroupAssignment {
  A: number[];
  B: number[];
}

export interface Knockout {
  sfG1: MatchScore;
  sfG2: MatchScore;
  finalG: MatchScore;
  sfS1: MatchScore;
  sfS2: MatchScore;
  finalS: MatchScore;
}

export type KnockoutKey = keyof Knockout;

export interface WeekData {
  assignedRound: number | null;
  groupAssignment: GroupAssignment | null;
  groupScores: {
    A: MatchScore[];
    B: MatchScore[];
  };
  knockout: Knockout;
  playerOverrides: Record<string, string>;
}

export type WeeksMap = Record<number, WeekData>;

export interface SeasonConfig {
  nome: string;
  players: string[];
  dates: string[];
}

export type RoundStatus = 'undrawn' | 'upcoming' | 'progress' | 'done';

export interface GroupStandingRow {
  duplaNo: number;
  group: 'A' | 'B';
  jogos: number;
  v: number;
  d: number;
  pf: number;
  pc: number;
  saldo: number;
  pts: number;
  pos: number;
}

export interface RankingRow {
  num: number;
  name: string;
  pts: number;
  pos: number;
}
