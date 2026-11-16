import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  Exercise,
  Formation,
  Match,
  N3comDatabase,
  Player,
  PlayerEvaluation,
  PlayerMatchStat,
  Play,
  Rival,
  Team,
  TrainingObjective,
  TrainingSession,
} from '../domain/types';
import { createId } from '../domain/ids';
import {
  exportDatabaseJson,
  loadDatabase,
  parseImportedBackup,
  saveDatabase,
} from '../storage/localStorageRepo';
import { createDemoDatabase, createEmptyDatabase } from '../storage/seedData';

interface CoachContextValue {
  db: N3comDatabase;
  activeTeam: Team | null;
  teamPlayers: Player[];
  teamFormations: Formation[];
  teamPlays: Play[];
  teamExercises: Exercise[];
  teamSessions: TrainingSession[];
  teamRivals: Rival[];
  teamMatches: Match[];
  teamObjectives: TrainingObjective[];
  teamStats: PlayerMatchStat[];
  teamEvaluations: PlayerEvaluation[];

  setActiveTeam: (teamId: string) => void;
  upsertTeam: (team: Omit<Team, 'id' | 'createdAt'> & { id?: string }) => Team;
  deleteTeam: (teamId: string) => void;

  upsertPlayer: (player: Omit<Player, 'id' | 'createdAt'> & { id?: string }) => void;
  deletePlayer: (playerId: string) => void;

  saveFormation: (
    formation: Omit<Formation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Formation;
  duplicateFormation: (formationId: string) => Formation | null;
  deleteFormation: (formationId: string) => void;

  savePlay: (play: Omit<Play, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Play;
  deletePlay: (playId: string) => void;

  addExerciseCategory: (category: string) => void;
  upsertExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'> & { id?: string }) => Exercise;
  deleteExercise: (exerciseId: string) => void;

  upsertSession: (
    session: Omit<TrainingSession, 'id' | 'createdAt'> & { id?: string }
  ) => TrainingSession;
  deleteSession: (sessionId: string) => void;

  upsertRival: (rival: Omit<Rival, 'id' | 'createdAt'> & { id?: string }) => Rival;
  deleteRival: (rivalId: string) => void;

  upsertMatch: (match: Omit<Match, 'id' | 'createdAt'> & { id?: string }) => Match;
  deleteMatch: (matchId: string) => void;

  upsertObjective: (
    obj: Omit<TrainingObjective, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => TrainingObjective;
  deleteObjective: (objectiveId: string) => void;

  upsertStat: (stat: Omit<PlayerMatchStat, 'id' | 'updatedAt'> & { id?: string }) => void;
  deleteStat: (statId: string) => void;

  addEvaluation: (evaluation: Omit<PlayerEvaluation, 'id' | 'createdAt'>) => void;
  deleteEvaluation: (evaluationId: string) => void;

  exportBackup: () => string;
  importBackup: (jsonText: string) => void;
  loadDemoData: () => void;
  clearAllData: () => void;
}

const CoachContext = createContext<CoachContextValue | null>(null);

export const CoachProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<N3comDatabase>(() => loadDatabase());

  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  const activeTeam = useMemo(
    () => db.teams.find((t) => t.id === db.activeTeamId) ?? db.teams[0] ?? null,
    [db.teams, db.activeTeamId]
  );

  const activeTeamId = activeTeam?.id ?? null;

  const teamPlayers = useMemo(
    () => db.players.filter((p) => p.teamId === activeTeamId),
    [db.players, activeTeamId]
  );
  const teamFormations = useMemo(
    () => db.formations.filter((f) => f.teamId === activeTeamId),
    [db.formations, activeTeamId]
  );
  const teamPlays = useMemo(
    () => db.plays.filter((p) => p.teamId === activeTeamId),
    [db.plays, activeTeamId]
  );
  const teamExercises = useMemo(
    () => db.exercises.filter((e) => e.teamId === activeTeamId),
    [db.exercises, activeTeamId]
  );
  const teamSessions = useMemo(
    () =>
      db.sessions
        .filter((s) => s.teamId === activeTeamId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [db.sessions, activeTeamId]
  );
  const teamRivals = useMemo(
    () => db.rivals.filter((r) => r.teamId === activeTeamId),
    [db.rivals, activeTeamId]
  );
  const teamMatches = useMemo(
    () =>
      db.matches
        .filter((m) => m.teamId === activeTeamId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [db.matches, activeTeamId]
  );
  const teamObjectives = useMemo(
    () => db.objectives.filter((o) => o.teamId === activeTeamId),
    [db.objectives, activeTeamId]
  );
  const teamStats = useMemo(
    () => db.stats.filter((s) => s.teamId === activeTeamId),
    [db.stats, activeTeamId]
  );
  const teamEvaluations = useMemo(
    () =>
      db.evaluations
        .filter((e) => e.teamId === activeTeamId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [db.evaluations, activeTeamId]
  );

  const setActiveTeam = useCallback((teamId: string) => {
    setDb((prev) => ({ ...prev, activeTeamId: teamId }));
  }, []);

  const upsertTeam = useCallback((input: Omit<Team, 'id' | 'createdAt'> & { id?: string }): Team => {
    const now = new Date().toISOString();
    let createdOrUpdated!: Team;
    setDb((prev) => {
      const existing = input.id ? prev.teams.find((t) => t.id === input.id) : undefined;
      if (existing) {
        createdOrUpdated = { ...existing, ...input, id: existing.id };
        return {
          ...prev,
          teams: prev.teams.map((t) => (t.id === existing.id ? createdOrUpdated : t)),
        };
      }
      createdOrUpdated = {
        ...input,
        id: createId('team'),
        createdAt: now,
      };
      return {
        ...prev,
        activeTeamId: createdOrUpdated.id,
        teams: [...prev.teams, createdOrUpdated],
      };
    });
    return createdOrUpdated;
  }, []);

  const deleteTeam = useCallback((teamId: string) => {
    setDb((prev) => {
      const remainingTeams = prev.teams.filter((t) => t.id !== teamId);
      return {
        ...prev,
        activeTeamId:
          prev.activeTeamId === teamId ? (remainingTeams[0]?.id ?? null) : prev.activeTeamId,
        teams: remainingTeams,
        players: prev.players.filter((x) => x.teamId !== teamId),
        formations: prev.formations.filter((x) => x.teamId !== teamId),
        plays: prev.plays.filter((x) => x.teamId !== teamId),
        exercises: prev.exercises.filter((x) => x.teamId !== teamId),
        sessions: prev.sessions.filter((x) => x.teamId !== teamId),
        rivals: prev.rivals.filter((x) => x.teamId !== teamId),
        matches: prev.matches.filter((x) => x.teamId !== teamId),
        objectives: prev.objectives.filter((x) => x.teamId !== teamId),
        stats: prev.stats.filter((x) => x.teamId !== teamId),
        evaluations: prev.evaluations.filter((x) => x.teamId !== teamId),
      };
    });
  }, []);

  const upsertPlayer = useCallback(
    (input: Omit<Player, 'id' | 'createdAt'> & { id?: string }) => {
      const now = new Date().toISOString();
      setDb((prev) => {
        const existing = input.id ? prev.players.find((p) => p.id === input.id) : undefined;
        if (existing) {
          const updated: Player = { ...existing, ...input, id: existing.id };
          return {
            ...prev,
            players: prev.players.map((p) => (p.id === existing.id ? updated : p)),
          };
        }
        const created: Player = { ...input, id: createId('pl'), createdAt: now };
        return { ...prev, players: [...prev.players, created] };
      });
    },
    []
  );

  const deletePlayer = useCallback((playerId: string) => {
    setDb((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== playerId),
      stats: prev.stats.filter((s) => s.playerId !== playerId),
      evaluations: prev.evaluations.filter((e) => e.playerId !== playerId),
    }));
  }, []);

  const saveFormation = useCallback(
    (input: Omit<Formation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Formation => {
      const now = new Date().toISOString();
      let saved!: Formation;
      setDb((prev) => {
        const existing = input.id ? prev.formations.find((f) => f.id === input.id) : undefined;
        if (existing) {
          saved = {
            ...existing,
            ...input,
            id: existing.id,
            players: input.players.map((p) => ({ ...p })),
            tags: [...input.tags],
            updatedAt: now,
          };
          return {
            ...prev,
            formations: prev.formations.map((f) => (f.id === existing.id ? saved : f)),
          };
        }
        saved = {
          ...input,
          id: createId('form'),
          players: input.players.map((p) => ({ ...p })),
          tags: [...input.tags],
          createdAt: now,
          updatedAt: now,
        };
        return { ...prev, formations: [...prev.formations, saved] };
      });
      return saved;
    },
    []
  );

  const duplicateFormation = useCallback((formationId: string): Formation | null => {
    const now = new Date().toISOString();
    let copy: Formation | null = null;
    setDb((prev) => {
      const original = prev.formations.find((f) => f.id === formationId);
      if (!original) return prev;
      copy = {
        ...original,
        id: createId('form'),
        name: `${original.name} (Copia)`,
        players: original.players.map((p) => ({ ...p, id: createId('fp') })),
        tags: [...original.tags],
        createdAt: now,
        updatedAt: now,
      };
      return { ...prev, formations: [...prev.formations, copy] };
    });
    return copy;
  }, []);

  const deleteFormation = useCallback((formationId: string) => {
    setDb((prev) => ({
      ...prev,
      formations: prev.formations.filter((f) => f.id !== formationId),
    }));
  }, []);

  const savePlay = useCallback(
    (input: Omit<Play, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Play => {
      const now = new Date().toISOString();
      let saved!: Play;
      setDb((prev) => {
        const existing = input.id ? prev.plays.find((p) => p.id === input.id) : undefined;
        if (existing) {
          saved = {
            ...existing,
            ...input,
            id: existing.id,
            players: input.players.map((p) => ({ ...p })),
            movements: input.movements.map((m) => ({ ...m, from: { ...m.from }, to: { ...m.to } })),
            zones: input.zones.map((z) => ({ ...z })),
            updatedAt: now,
          };
          return {
            ...prev,
            plays: prev.plays.map((p) => (p.id === existing.id ? saved : p)),
          };
        }
        saved = {
          ...input,
          id: createId('play'),
          players: input.players.map((p) => ({ ...p })),
          movements: input.movements.map((m) => ({ ...m, from: { ...m.from }, to: { ...m.to } })),
          zones: input.zones.map((z) => ({ ...z })),
          createdAt: now,
          updatedAt: now,
        };
        return { ...prev, plays: [...prev.plays, saved] };
      });
      return saved;
    },
    []
  );

  const deletePlay = useCallback((playId: string) => {
    setDb((prev) => ({
      ...prev,
      plays: prev.plays.filter((p) => p.id !== playId),
    }));
  }, []);

  const addExerciseCategory = useCallback((category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    setDb((prev) => {
      if (prev.exerciseCategories.includes(trimmed)) return prev;
      return { ...prev, exerciseCategories: [...prev.exerciseCategories, trimmed] };
    });
  }, []);

  const upsertExercise = useCallback(
    (input: Omit<Exercise, 'id' | 'createdAt'> & { id?: string }): Exercise => {
      const now = new Date().toISOString();
      let saved!: Exercise;
      setDb((prev) => {
        const existing = input.id ? prev.exercises.find((e) => e.id === input.id) : undefined;
        if (existing) {
          saved = { ...existing, ...input, id: existing.id };
          return {
            ...prev,
            exercises: prev.exercises.map((e) => (e.id === existing.id ? saved : e)),
          };
        }
        saved = { ...input, id: createId('ex'), createdAt: now };
        return { ...prev, exercises: [...prev.exercises, saved] };
      });
      return saved;
    },
    []
  );

  const deleteExercise = useCallback((exerciseId: string) => {
    setDb((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((e) => e.id !== exerciseId),
    }));
  }, []);

  const upsertSession = useCallback(
    (input: Omit<TrainingSession, 'id' | 'createdAt'> & { id?: string }): TrainingSession => {
      const now = new Date().toISOString();
      let saved!: TrainingSession;
      setDb((prev) => {
        const existing = input.id ? prev.sessions.find((s) => s.id === input.id) : undefined;
        if (existing) {
          saved = { ...existing, ...input, id: existing.id };
          return {
            ...prev,
            sessions: prev.sessions.map((s) => (s.id === existing.id ? saved : s)),
          };
        }
        saved = { ...input, id: createId('ses'), createdAt: now };
        return { ...prev, sessions: [...prev.sessions, saved] };
      });
      return saved;
    },
    []
  );

  const deleteSession = useCallback((sessionId: string) => {
    setDb((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  }, []);

  const upsertRival = useCallback(
    (input: Omit<Rival, 'id' | 'createdAt'> & { id?: string }): Rival => {
      const now = new Date().toISOString();
      let saved!: Rival;
      setDb((prev) => {
        const existing = input.id ? prev.rivals.find((r) => r.id === input.id) : undefined;
        if (existing) {
          saved = { ...existing, ...input, id: existing.id };
          return {
            ...prev,
            rivals: prev.rivals.map((r) => (r.id === existing.id ? saved : r)),
          };
        }
        saved = { ...input, id: createId('riv'), createdAt: now };
        return { ...prev, rivals: [...prev.rivals, saved] };
      });
      return saved;
    },
    []
  );

  const deleteRival = useCallback((rivalId: string) => {
    setDb((prev) => ({
      ...prev,
      rivals: prev.rivals.filter((r) => r.id !== rivalId),
    }));
  }, []);

  const upsertMatch = useCallback(
    (input: Omit<Match, 'id' | 'createdAt'> & { id?: string }): Match => {
      const now = new Date().toISOString();
      let saved!: Match;
      setDb((prev) => {
        const existing = input.id ? prev.matches.find((m) => m.id === input.id) : undefined;
        if (existing) {
          saved = { ...existing, ...input, id: existing.id };
          return {
            ...prev,
            matches: prev.matches.map((m) => (m.id === existing.id ? saved : m)),
          };
        }
        saved = { ...input, id: createId('match'), createdAt: now };
        return { ...prev, matches: [...prev.matches, saved] };
      });
      return saved;
    },
    []
  );

  const deleteMatch = useCallback((matchId: string) => {
    setDb((prev) => ({
      ...prev,
      matches: prev.matches.filter((m) => m.id !== matchId),
      stats: prev.stats.filter((s) => s.matchId !== matchId),
    }));
  }, []);

  const upsertObjective = useCallback(
    (
      input: Omit<TrainingObjective, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ): TrainingObjective => {
      const now = new Date().toISOString();
      let saved!: TrainingObjective;
      setDb((prev) => {
        const existing = input.id ? prev.objectives.find((o) => o.id === input.id) : undefined;
        if (existing) {
          saved = { ...existing, ...input, id: existing.id, updatedAt: now };
          return {
            ...prev,
            objectives: prev.objectives.map((o) => (o.id === existing.id ? saved : o)),
          };
        }
        saved = { ...input, id: createId('obj'), createdAt: now, updatedAt: now };
        return { ...prev, objectives: [...prev.objectives, saved] };
      });
      return saved;
    },
    []
  );

  const deleteObjective = useCallback((objectiveId: string) => {
    setDb((prev) => ({
      ...prev,
      objectives: prev.objectives.filter((o) => o.id !== objectiveId),
    }));
  }, []);

  const upsertStat = useCallback(
    (input: Omit<PlayerMatchStat, 'id' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString();
      setDb((prev) => {
        const existing = prev.stats.find(
          (s) =>
            (input.id && s.id === input.id) ||
            (s.teamId === input.teamId &&
              s.matchId === input.matchId &&
              s.playerId === input.playerId)
        );
        if (existing) {
          const updated: PlayerMatchStat = {
            ...existing,
            ...input,
            id: existing.id,
            updatedAt: now,
          };
          return {
            ...prev,
            stats: prev.stats.map((s) => (s.id === existing.id ? updated : s)),
          };
        }
        const created: PlayerMatchStat = { ...input, id: createId('st'), updatedAt: now };
        return { ...prev, stats: [...prev.stats, created] };
      });
    },
    []
  );

  const deleteStat = useCallback((statId: string) => {
    setDb((prev) => ({
      ...prev,
      stats: prev.stats.filter((s) => s.id !== statId),
    }));
  }, []);

  const addEvaluation = useCallback((input: Omit<PlayerEvaluation, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const created: PlayerEvaluation = { ...input, id: createId('ev'), createdAt: now };
    setDb((prev) => ({ ...prev, evaluations: [...prev.evaluations, created] }));
  }, []);

  const deleteEvaluation = useCallback((evaluationId: string) => {
    setDb((prev) => ({
      ...prev,
      evaluations: prev.evaluations.filter((e) => e.id !== evaluationId),
    }));
  }, []);

  const exportBackup = useCallback(() => exportDatabaseJson(db), [db]);

  const importBackup = useCallback((jsonText: string) => {
    const imported = parseImportedBackup(jsonText);
    if (!imported.activeTeamId && imported.teams.length > 0) {
      imported.activeTeamId = imported.teams[0].id;
    }
    setDb(imported);
  }, []);

  const loadDemoData = useCallback(() => {
    setDb(createDemoDatabase());
  }, []);

  const clearAllData = useCallback(() => {
    setDb(createEmptyDatabase());
  }, []);

  return (
    <CoachContext.Provider
      value={{
        db,
        activeTeam,
        teamPlayers,
        teamFormations,
        teamPlays,
        teamExercises,
        teamSessions,
        teamRivals,
        teamMatches,
        teamObjectives,
        teamStats,
        teamEvaluations,
        setActiveTeam,
        upsertTeam,
        deleteTeam,
        upsertPlayer,
        deletePlayer,
        saveFormation,
        duplicateFormation,
        deleteFormation,
        savePlay,
        deletePlay,
        addExerciseCategory,
        upsertExercise,
        deleteExercise,
        upsertSession,
        deleteSession,
        upsertRival,
        deleteRival,
        upsertMatch,
        deleteMatch,
        upsertObjective,
        deleteObjective,
        upsertStat,
        deleteStat,
        addEvaluation,
        deleteEvaluation,
        exportBackup,
        importBackup,
        loadDemoData,
        clearAllData,
      }}
    >
      {children}
    </CoachContext.Provider>
  );
};

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) {
    throw new Error('useCoach debe usarse dentro de CoachProvider');
  }
  return ctx;
}
