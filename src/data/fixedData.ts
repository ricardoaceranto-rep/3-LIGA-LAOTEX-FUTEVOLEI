// Dados fixos da temporada — vêm do briefing (seção 8) e NÃO são regerados
// nem editáveis pelo app. As duplas de cada um dos 15 sorteios já foram
// validadas matematicamente (as 120 combinações possíveis entre os 16
// jogadores aparecem exatamente uma vez na temporada).

export const SEASON_NAME = '3º LIGA LALOTEX DE FUTÊVOLEI';

export const N_PLAYERS = 16;
export const N_ROUNDS = 15;
export const GROUPS = ['A', 'B'] as const;
export type GroupKey = (typeof GROUPS)[number];

export const PLAYERS_INITIAL: string[] = [
  'Edmilson', 'Viana', 'Tic Tac', 'Nica', 'Marcelinho', 'Macarrão', 'Rizo', 'Eduardinho',
  'Fagner', 'Feto', 'Dudu', 'Naldo', 'Paulinho', 'Pandinha', 'Pescuma', 'Ricardinho',
];

export const DATES: string[] = [
  '2026-08-17', '2026-08-24', '2026-08-31', '2026-09-14', '2026-09-21', '2026-09-28',
  '2026-10-05', '2026-10-19', '2026-10-26', '2026-11-09', '2026-11-16', '2026-11-23',
  '2026-11-30', '2026-12-07', '2026-12-14',
];

// Índice do array (0-14) = Sorteio nº (índice+1). Cada sorteio tem 8 duplas
// [jogadorA, jogadorB] (números de jogador, 1-16). A divisão em Grupo A/B
// é sorteada à parte, no momento em que o sorteio é atribuído a uma semana.
export const ROUNDS: number[][][] = [
  [[4, 3], [13, 1], [7, 6], [2, 14], [9, 5], [11, 12], [10, 8], [16, 15]],
  [[5, 12], [3, 7], [15, 4], [6, 1], [13, 11], [9, 14], [8, 16], [10, 2]],
  [[8, 5], [2, 11], [9, 1], [7, 12], [14, 16], [13, 4], [15, 10], [6, 3]],
  [[2, 3], [13, 12], [7, 16], [15, 5], [4, 8], [1, 10], [14, 11], [9, 6]],
  [[12, 10], [11, 3], [15, 7], [9, 16], [14, 13], [8, 2], [5, 6], [1, 4]],
  [[3, 16], [14, 7], [4, 10], [1, 5], [8, 6], [9, 12], [11, 15], [2, 13]],
  [[8, 3], [14, 1], [4, 16], [6, 2], [12, 15], [5, 11], [7, 10], [9, 13]],
  [[11, 1], [8, 13], [15, 9], [5, 7], [4, 14], [16, 6], [3, 10], [2, 12]],
  [[1, 12], [3, 15], [4, 6], [2, 5], [11, 9], [16, 10], [14, 8], [13, 7]],
  [[3, 9], [10, 11], [16, 1], [8, 7], [12, 6], [4, 2], [14, 5], [15, 13]],
  [[1, 3], [5, 13], [9, 10], [2, 16], [8, 15], [7, 4], [12, 14], [6, 11]],
  [[3, 13], [4, 12], [14, 10], [7, 9], [5, 16], [6, 15], [11, 8], [1, 2]],
  [[1, 15], [14, 3], [16, 13], [10, 6], [7, 11], [12, 8], [2, 9], [4, 5]],
  [[2, 7], [1, 8], [16, 11], [12, 3], [15, 14], [9, 4], [5, 10], [6, 13]],
  [[15, 2], [8, 9], [5, 3], [13, 10], [6, 14], [16, 12], [11, 4], [1, 7]],
];

// Todos x todos, turno único, entre 4 duplas locais (índices 0-3 dentro do grupo)
export const MATCH_PATTERN: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
];

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export const PTS_VITORIA = 3;
export const COURT_NAMES: Record<number, string> = { 1: 'LABOMLOTEX', 2: 'CARANLOTEX' };
export function courtOfGame(gameIndex: number): 1 | 2 {
  return gameIndex % 2 === 0 ? 1 : 2;
}

export const PONTOS_CAMPEAO_OURO = 8;
export const PONTOS_VICE_OURO = 6;
export const PONTOS_SEMI_OURO = 4;
export const PONTOS_CAMPEAO_PRATA = 3;
export const PONTOS_VICE_PRATA = 2;
export const PONTOS_SEMI_PRATA = 1;
