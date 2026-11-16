import { describe, expect, it } from 'vitest';
import { aggregateStats, emptyMetrics } from './stats';
import type { PlayerMatchStat } from './types';

describe('aggregateStats', () => {
  it('calcula totales y eficiencia correctamente con registros completos', () => {
    const records: PlayerMatchStat[] = [
      {
        id: 's1',
        teamId: 't1',
        matchId: 'm1',
        playerId: 'p1',
        metrics: {
          effectiveServes: 4,
          serveErrors: 1,
          positiveReceptions: 5,
          accuratePasses: 6,
          effectiveThrows: 5,
          unforcedErrors: 1,
        },
        updatedAt: '2026-11-10T00:00:00Z',
      },
    ];

    const res = aggregateStats(records);
    expect(res.hasIncompleteData).toBe(false);
    expect(res.byMetric.effectiveServes.total).toBe(4);
    expect(res.byMetric.effectiveThrows.total).toBe(5);
    // Positivas: 4+5+6+5 = 20; Errores: 1+1 = 2; 20/22 = 91%
    expect(res.efficiencyPct).toBe(91);
  });

  it('no inventa valores faltantes (null) y marca el indicador como incompleto', () => {
    const m1 = emptyMetrics();
    m1.effectiveServes = 3;
    m1.positiveReceptions = null;

    const m2 = emptyMetrics();
    m2.effectiveServes = 2;
    m2.positiveReceptions = 4;

    const records: PlayerMatchStat[] = [
      { id: 's1', teamId: 't1', matchId: 'm1', playerId: 'p1', metrics: m1, updatedAt: '' },
      { id: 's2', teamId: 't1', matchId: 'm2', playerId: 'p1', metrics: m2, updatedAt: '' },
    ];

    const res = aggregateStats(records);
    expect(res.hasIncompleteData).toBe(true);
    expect(res.byMetric.effectiveServes.total).toBe(5);
    expect(res.byMetric.effectiveServes.isIncomplete).toBe(false);
    expect(res.byMetric.positiveReceptions.total).toBe(4);
    expect(res.byMetric.positiveReceptions.recordedCount).toBe(1);
    expect(res.byMetric.positiveReceptions.expectedCount).toBe(2);
    expect(res.byMetric.positiveReceptions.isIncomplete).toBe(true);
    expect(res.byMetric.serveErrors.total).toBeNull();
  });
});
