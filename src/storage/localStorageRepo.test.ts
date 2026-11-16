import { describe, expect, it } from 'vitest';
import { exportDatabaseJson, normalizeDatabase, parseImportedBackup } from './localStorageRepo';
import { createDemoDatabase } from './seedData';

describe('localStorageRepo backup y normalización', () => {
  it('exporta e importa un respaldo JSON sin pérdida de datos', () => {
    const demo = createDemoDatabase();
    const json = exportDatabaseJson(demo);
    const restored = parseImportedBackup(json);

    expect(restored.schemaVersion).toBe(1);
    expect(restored.teams).toHaveLength(demo.teams.length);
    expect(restored.players).toHaveLength(demo.players.length);
    expect(restored.formations).toHaveLength(demo.formations.length);
    expect(restored.plays).toHaveLength(demo.plays.length);
    expect(restored.matches).toHaveLength(demo.matches.length);
    expect(restored.objectives).toHaveLength(demo.objectives.length);
  });

  it('normaliza entradas inválidas sin lanzar errores', () => {
    const safe = normalizeDatabase(null);
    expect(safe.schemaVersion).toBe(1);
    expect(safe.teams).toEqual([]);
  });
});
