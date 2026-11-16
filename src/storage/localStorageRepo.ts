import type { N3comDatabase } from '../domain/types';
import { createDemoDatabase, createEmptyDatabase, DEFAULT_EXERCISE_CATEGORIES } from './seedData';

export const STORAGE_KEY = 'n3com_coach_db_v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeDatabase(raw: unknown): N3comDatabase {
  const fallback = createEmptyDatabase();
  if (!isRecord(raw)) return fallback;

  return {
    schemaVersion: 1,
    activeTeamId: typeof raw.activeTeamId === 'string' ? raw.activeTeamId : null,
    exerciseCategories: Array.isArray(raw.exerciseCategories)
      ? raw.exerciseCategories.filter((c): c is string => typeof c === 'string')
      : [...DEFAULT_EXERCISE_CATEGORIES],
    teams: Array.isArray(raw.teams) ? raw.teams : [],
    players: Array.isArray(raw.players) ? raw.players : [],
    formations: Array.isArray(raw.formations) ? raw.formations : [],
    plays: Array.isArray(raw.plays) ? raw.plays : [],
    exercises: Array.isArray(raw.exercises) ? raw.exercises : [],
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    rivals: Array.isArray(raw.rivals) ? raw.rivals : [],
    matches: Array.isArray(raw.matches) ? raw.matches : [],
    objectives: Array.isArray(raw.objectives) ? raw.objectives : [],
    stats: Array.isArray(raw.stats) ? raw.stats : [],
    evaluations: Array.isArray(raw.evaluations) ? raw.evaluations : [],
  };
}

export function loadDatabase(): N3comDatabase {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const demo = createDemoDatabase();
      saveDatabase(demo);
      return demo;
    }
    const parsed: unknown = JSON.parse(raw);
    const db = normalizeDatabase(parsed);
    if (!db.activeTeamId && db.teams.length > 0) {
      db.activeTeamId = db.teams[0].id;
    }
    return db;
  } catch {
    return createDemoDatabase();
  }
}

export function saveDatabase(db: N3comDatabase): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Error guardando en localStorage:', err);
  }
}

export function exportDatabaseJson(db: N3comDatabase): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: 'N3com Coach',
      data: db,
    },
    null,
    2
  );
}

export function parseImportedBackup(jsonText: string): N3comDatabase {
  const parsed: unknown = JSON.parse(jsonText);
  if (isRecord(parsed) && 'data' in parsed) {
    return normalizeDatabase(parsed.data);
  }
  return normalizeDatabase(parsed);
}
