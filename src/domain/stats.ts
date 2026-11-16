import type { PlayerMatchStat, StatMetricDefinition, StatMetricKey } from './types';

export const NEWCOM_METRICS: StatMetricDefinition[] = [
  {
    key: 'effectiveServes',
    label: 'Saques efectivos',
    shortLabel: 'Saq. Ef.',
    description: 'Saques válidos que ponen en juego o generan punto directo.',
    positive: true,
  },
  {
    key: 'serveErrors',
    label: 'Errores de saque',
    shortLabel: 'Err. Saq.',
    description: 'Saques fuera, a la red o con falta reglamentaria.',
    positive: false,
  },
  {
    key: 'positiveReceptions',
    label: 'Recepciones positivas',
    shortLabel: 'Rec. Pos.',
    description: 'Atrapes y recepciones limpias que permiten construir jugada.',
    positive: true,
  },
  {
    key: 'accuratePasses',
    label: 'Pases precisos',
    shortLabel: 'Pases',
    description: 'Pases controlados hacia compañeros en posición favorable.',
    positive: true,
  },
  {
    key: 'effectiveThrows',
    label: 'Lanzamientos / Puntos',
    shortLabel: 'Lanz. Ef.',
    description: 'Lanzamientos ofensivos efectivos o puntos convertidos.',
    positive: true,
  },
  {
    key: 'unforcedErrors',
    label: 'Errores no forzados',
    shortLabel: 'Err. NF',
    description: 'Pérdidas de balón, dobles toques o errores sin presión rival.',
    positive: false,
  },
];

export interface AggregatedMetricSummary {
  total: number | null;
  recordedCount: number;
  expectedCount: number;
  isIncomplete: boolean;
}

export interface StatAggregateResult {
  byMetric: Record<StatMetricKey, AggregatedMetricSummary>;
  totalRecords: number;
  hasIncompleteData: boolean;
  /** Ratio de acciones positivas sobre positivas + errores (solo sobre datos reales registrados) */
  efficiencyPct: number | null;
}

export function emptyMetrics(): Record<StatMetricKey, number | null> {
  return {
    effectiveServes: null,
    serveErrors: null,
    positiveReceptions: null,
    accuratePasses: null,
    effectiveThrows: null,
    unforcedErrors: null,
  };
}

/**
 * Agrega estadísticas sin inventar valores faltantes:
 * si un indicador es `null`, no se suma como 0 y se marca como incompleto.
 */
export function aggregateStats(records: PlayerMatchStat[]): StatAggregateResult {
  const byMetric = {} as Record<StatMetricKey, AggregatedMetricSummary>;
  let hasIncompleteData = false;

  for (const def of NEWCOM_METRICS) {
    let sum = 0;
    let recordedCount = 0;
    for (const rec of records) {
      const val = rec.metrics[def.key];
      if (val !== null && val !== undefined && !Number.isNaN(val)) {
        sum += val;
        recordedCount += 1;
      }
    }
    const isIncomplete = records.length > 0 && recordedCount < records.length;
    if (isIncomplete) {
      hasIncompleteData = true;
    }
    byMetric[def.key] = {
      total: recordedCount > 0 ? sum : null,
      recordedCount,
      expectedCount: records.length,
      isIncomplete,
    };
  }

  let positiveSum = 0;
  let negativeSum = 0;
  let hasPositive = false;
  let hasNegative = false;

  for (const def of NEWCOM_METRICS) {
    const val = byMetric[def.key].total;
    if (val !== null) {
      if (def.positive) {
        positiveSum += val;
        hasPositive = true;
      } else {
        negativeSum += val;
        hasNegative = true;
      }
    }
  }

  const totalActions = (hasPositive ? positiveSum : 0) + (hasNegative ? negativeSum : 0);
  const efficiencyPct =
    totalActions > 0 ? Math.round(((hasPositive ? positiveSum : 0) / totalActions) * 100) : null;

  return {
    byMetric,
    totalRecords: records.length,
    hasIncompleteData,
    efficiencyPct,
  };
}
