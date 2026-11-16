export type NavSection =
  | 'dashboard'
  | 'teams'
  | 'strategies'
  | 'trainings'
  | 'stats'
  | 'matches';

export interface Team {
  id: string;
  name: string;
  category: string;
  season: string;
  coachName: string;
  notes: string;
  createdAt: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: string;
  role: string;
  active: boolean;
  notes: string;
  createdAt: string;
}

export interface CourtPoint {
  /** Coordenada normalizada 0..100 en ancho de cancha */
  x: number;
  /** Coordenada normalizada 0..100 en alto de cancha */
  y: number;
}

export interface FormationPlayer {
  id: string;
  playerId?: string;
  label: string;
  number: string;
  x: number;
  y: number;
  color: string;
}

export interface Formation {
  id: string;
  teamId: string;
  name: string;
  category: string;
  tags: string[];
  players: FormationPlayer[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementKind = 'pass' | 'move' | 'attack' | 'cover';

export interface TacticalMovement {
  id: string;
  kind: MovementKind;
  from: CourtPoint;
  to: CourtPoint;
  label?: string;
}

export interface TacticalZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
}

export interface Play {
  id: string;
  teamId: string;
  name: string;
  description: string;
  formationId?: string;
  formationNameSnapshot?: string;
  players: FormationPlayer[];
  movements: TacticalMovement[];
  zones: TacticalZone[];
  tacticalObjective: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ExerciseDifficulty = 'Básico' | 'Intermedio' | 'Avanzado';

export interface Exercise {
  id: string;
  teamId: string;
  name: string;
  description: string;
  objective: string;
  category: string;
  difficulty: ExerciseDifficulty;
  estimatedMinutes: number;
  materials: string;
  indications: string;
  notes: string;
  createdAt: string;
}

export interface SessionExercise {
  id: string;
  exerciseId: string;
  order: number;
  plannedMinutes: number;
  completed: boolean;
  notes?: string;
}

export type SessionStatus = 'planificada' | 'realizada';

export interface TrainingSession {
  id: string;
  teamId: string;
  name: string;
  date: string;
  objectiveId?: string;
  objectiveText: string;
  exercises: SessionExercise[];
  plannedMinutes: number;
  actualMinutes?: number;
  status: SessionStatus;
  plannedNotes: string;
  actualNotes?: string;
  improvementsNeeded?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Rival {
  id: string;
  teamId: string;
  name: string;
  category: string;
  strengths: string;
  weaknesses: string;
  tacticalNotes: string;
  createdAt: string;
}

export type MatchResult = 'ganado' | 'perdido' | 'empatado' | 'sin_definir';

export interface Match {
  id: string;
  teamId: string;
  rivalId?: string;
  rivalName: string;
  date: string;
  competition: string;
  result: MatchResult;
  scoreSummary: string;
  generalNotes: string;
  strengths: string[];
  weaknesses: string[];
  observations: string[];
  createdAt: string;
}

export type ObjectiveStatus = 'pendiente' | 'en_progreso' | 'logrado';

export interface TrainingObjective {
  id: string;
  teamId: string;
  title: string;
  description: string;
  sourceMatchId?: string;
  sourceLabel?: string;
  status: ObjectiveStatus;
  createdAt: string;
  updatedAt: string;
}

export type StatMetricKey =
  | 'effectiveServes'
  | 'serveErrors'
  | 'positiveReceptions'
  | 'accuratePasses'
  | 'effectiveThrows'
  | 'unforcedErrors';

export interface StatMetricDefinition {
  key: StatMetricKey;
  label: string;
  shortLabel: string;
  description: string;
  positive: boolean;
}

export interface PlayerMatchStat {
  id: string;
  teamId: string;
  matchId: string;
  playerId: string;
  metrics: Record<StatMetricKey, number | null>;
  notes?: string;
  updatedAt: string;
}

export interface PlayerEvaluation {
  id: string;
  teamId: string;
  playerId: string;
  matchId?: string;
  date: string;
  rating: number | null;
  summary: string;
  createdAt: string;
}

export interface N3comDatabase {
  schemaVersion: 1;
  activeTeamId: string | null;
  exerciseCategories: string[];
  teams: Team[];
  players: Player[];
  formations: Formation[];
  plays: Play[];
  exercises: Exercise[];
  sessions: TrainingSession[];
  rivals: Rival[];
  matches: Match[];
  objectives: TrainingObjective[];
  stats: PlayerMatchStat[];
  evaluations: PlayerEvaluation[];
}
