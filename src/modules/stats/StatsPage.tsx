import React, { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Plus, Trash2, User } from 'lucide-react';
import { todayIsoDate } from '../../domain/ids';
import { aggregateStats, emptyMetrics, NEWCOM_METRICS } from '../../domain/stats';
import type { StatMetricKey } from '../../domain/types';
import { useCoach } from '../../state/CoachContext';

export const StatsPage: React.FC = () => {
  const {
    activeTeam,
    teamPlayers,
    teamMatches,
    teamStats,
    teamEvaluations,
    upsertStat,
    deleteStat,
    addEvaluation,
    deleteEvaluation,
  } = useCoach();

  const [viewMode, setViewMode] = useState<'collective' | 'individual' | 'register'>('collective');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(teamPlayers[0]?.id ?? '');

  // Formulario de carga/edición de estadística por partido + jugador
  const [formMatchId, setFormMatchId] = useState<string>(teamMatches[0]?.id ?? '');
  const [formPlayerId, setFormPlayerId] = useState<string>(teamPlayers[0]?.id ?? '');
  const [formMetrics, setFormMetrics] = useState<Record<StatMetricKey, string>>(() => {
    const out = {} as Record<StatMetricKey, string>;
    for (const m of NEWCOM_METRICS) out[m.key] = '';
    return out;
  });
  const [formNotes, setFormNotes] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Formulario de evaluación
  const [evalPlayerId, setEvalPlayerId] = useState<string>(teamPlayers[0]?.id ?? '');
  const [evalDate, setEvalDate] = useState<string>(todayIsoDate());
  const [evalRating, setEvalRating] = useState<string>('8');
  const [evalSummary, setEvalSummary] = useState<string>('');

  if (!activeTeam) {
    return <div className="empty-state">Seleccioná o creá un equipo primero.</div>;
  }

  const effectivePlayerId =
    teamPlayers.find((p) => p.id === selectedPlayerId)?.id ?? teamPlayers[0]?.id ?? '';

  const collectiveAgg = useMemo(() => aggregateStats(teamStats), [teamStats]);

  const individualRecords = useMemo(
    () => teamStats.filter((s) => s.playerId === effectivePlayerId),
    [teamStats, effectivePlayerId]
  );
  const individualAgg = useMemo(() => aggregateStats(individualRecords), [individualRecords]);

  // Evolución por partido ordenada cronológicamente
  const matchTimeline = useMemo(() => {
    const orderedMatches = [...teamMatches].sort((a, b) => a.date.localeCompare(b.date));
    return orderedMatches.map((match) => {
      const relevant =
        viewMode === 'individual'
          ? teamStats.filter((s) => s.matchId === match.id && s.playerId === effectivePlayerId)
          : teamStats.filter((s) => s.matchId === match.id);
      const agg = aggregateStats(relevant);
      return {
        match,
        efficiencyPct: agg.efficiencyPct,
        hasData: relevant.length > 0,
        hasIncompleteData: agg.hasIncompleteData,
      };
    });
  }, [teamMatches, teamStats, viewMode, effectivePlayerId]);

  const loadExistingStatIntoForm = (matchId: string, playerId: string) => {
    setFormMatchId(matchId);
    setFormPlayerId(playerId);
    const existing = teamStats.find((s) => s.matchId === matchId && s.playerId === playerId);
    const next = {} as Record<StatMetricKey, string>;
    for (const m of NEWCOM_METRICS) {
      const val = existing?.metrics[m.key];
      next[m.key] = val === null || val === undefined ? '' : String(val);
    }
    setFormMetrics(next);
    setFormNotes(existing?.notes ?? '');
  };

  const handleSaveStat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMatchId || !formPlayerId) return;
    const metrics = emptyMetrics();
    for (const m of NEWCOM_METRICS) {
      const raw = formMetrics[m.key].trim();
      metrics[m.key] = raw === '' ? null : Math.max(0, Number(raw));
    }
    upsertStat({
      teamId: activeTeam.id,
      matchId: formMatchId,
      playerId: formPlayerId,
      metrics,
      notes: formNotes.trim() || undefined,
    });
    setSavedNotice('Registro estadístico guardado y trazado al partido.');
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleAddEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlayer = evalPlayerId || effectivePlayerId;
    if (!targetPlayer || !evalSummary.trim()) return;
    addEvaluation({
      teamId: activeTeam.id,
      playerId: targetPlayer,
      date: evalDate || todayIsoDate(),
      rating: evalRating.trim() === '' ? null : Math.min(10, Math.max(1, Number(evalRating))),
      summary: evalSummary.trim(),
    });
    setEvalSummary('');
  };

  const getPlayerName = (id: string) => teamPlayers.find((p) => p.id === id)?.name ?? 'Jugador';
  const getMatchLabel = (id: string) => {
    const m = teamMatches.find((x) => x.id === id);
    return m ? `${m.date} · vs ${m.rivalName}` : 'Partido';
  };

  const activeAgg = viewMode === 'individual' ? individualAgg : collectiveAgg;
  const pointsWithEfficiency = matchTimeline.filter((t) => t.efficiencyPct !== null);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Estadísticas y Rendimiento</h1>
          <p>
            Indicadores trazables a partidos reales. Los valores no registrados se muestran como incompletos sin inventar ceros.
          </p>
        </div>
        <div className="row-gap">
          <button
            className={`btn btn-sm ${viewMode === 'collective' ? 'btn-primary' : ''}`}
            onClick={() => setViewMode('collective')}
          >
            <BarChart3 size={14} /> Colectivo
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'individual' ? 'btn-primary' : ''}`}
            onClick={() => setViewMode('individual')}
          >
            <User size={14} /> Individual
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'register' ? 'btn-primary' : ''}`}
            onClick={() => {
              const mId = formMatchId || teamMatches[0]?.id || '';
              const pId = formPlayerId || teamPlayers[0]?.id || '';
              loadExistingStatIntoForm(mId, pId);
              setViewMode('register');
            }}
          >
            <Plus size={14} /> Registrar datos
          </button>
        </div>
      </div>

      {viewMode === 'individual' && (
        <div className="card row-between">
          <div className="row-gap">
            <label style={{ fontWeight: 600, fontSize: '0.88rem' }}>Jugador:</label>
            <select
              className="select"
              style={{ width: 'auto', minWidth: 220 }}
              value={effectivePlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              {teamPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.number || '-'} {p.name}
                </option>
              ))}
            </select>
          </div>
          <span className="badge">{individualRecords.length} registros de partidos</span>
        </div>
      )}

      {viewMode !== 'register' && (
        <>
          {activeAgg.hasIncompleteData && (
            <div className="alert alert-warning row-gap">
              <AlertTriangle size={16} />
              <span>
                Existen registros con indicadores incompletos. Los promedios y totales se calculan únicamente sobre los datos reales cargados.
              </span>
            </div>
          )}

          {/* Resumen de indicadores */}
          <div className="grid-3">
            <div className="card kpi-card">
              <span className="kpi-label">Efectividad general (positivas / total)</span>
              <span className="kpi-value">
                {activeAgg.efficiencyPct !== null ? `${activeAgg.efficiencyPct}%` : 'Sin datos'}
              </span>
              <span className="kpi-sub">Basado en {activeAgg.totalRecords} registros reales</span>
            </div>
            {NEWCOM_METRICS.map((def) => {
              const item = activeAgg.byMetric[def.key];
              return (
                <div key={def.key} className="card kpi-card">
                  <div className="row-between">
                    <span className="kpi-label">{def.label}</span>
                    {item.isIncomplete && (
                      <span className="badge badge-warning">
                        Incompleto ({item.recordedCount}/{item.expectedCount})
                      </span>
                    )}
                  </div>
                  <span className="kpi-value">
                    {item.total !== null ? item.total : '—'}
                  </span>
                  <span className="kpi-sub">{def.description}</span>
                </div>
              );
            })}
          </div>

          {/* Gráfico SVG de evolución */}
          <div className="card stack">
            <div className="row-between">
              <h2 className="card-title">Evolución histórica de efectividad por partido</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {pointsWithEfficiency.length} partidos con datos
              </span>
            </div>
            {pointsWithEfficiency.length === 0 ? (
              <div className="empty-state">
                Registrá estadísticas en al menos un partido para visualizar la evolución.
              </div>
            ) : (
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg viewBox="0 0 600 180" style={{ width: '100%', maxHeight: 200 }}>
                  <line x1="40" y1="20" x2="40" y2="145" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="40" y1="145" x2="580" y2="145" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="10" y="25" fontSize="10" fill="#64748b">100%</text>
                  <text x="14" y="85" fontSize="10" fill="#64748b">50%</text>
                  <text x="18" y="145" fontSize="10" fill="#64748b">0%</text>
                  <line x1="40" y1="82" x2="580" y2="82" stroke="#e2e8f0" strokeDasharray="3 3" />

                  {pointsWithEfficiency.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      points={pointsWithEfficiency
                        .map((pt, idx) => {
                          const x =
                            65 +
                            (idx * 490) / Math.max(1, pointsWithEfficiency.length - 1);
                          const y = 145 - ((pt.efficiencyPct ?? 0) / 100) * 120;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {pointsWithEfficiency.map((pt, idx) => {
                    const x =
                      pointsWithEfficiency.length === 1
                        ? 310
                        : 65 + (idx * 490) / (pointsWithEfficiency.length - 1);
                    const y = 145 - ((pt.efficiencyPct ?? 0) / 100) * 120;
                    return (
                      <g key={pt.match.id}>
                        <circle cx={x} cy={y} r="5" fill="#0284c7" stroke="#fff" strokeWidth="1.5" />
                        <text x={x} y={y - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
                          {pt.efficiencyPct}%
                        </text>
                        <text x={x} y="162" textAnchor="middle" fontSize="9.5" fill="#475569">
                          {pt.match.rivalName.slice(0, 12)} ({pt.match.date.slice(5)})
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Tabla detallada trazable */}
          <div className="card stack">
            <h2 className="card-title">Registros históricos trazables</h2>
            {(viewMode === 'individual' ? individualRecords : teamStats).length === 0 ? (
              <div className="empty-state">No hay registros estadísticos cargados.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Partido</th>
                      <th>Jugador</th>
                      {NEWCOM_METRICS.map((m) => (
                        <th key={m.key}>{m.shortLabel}</th>
                      ))}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewMode === 'individual' ? individualRecords : teamStats).map((rec) => (
                      <tr key={rec.id}>
                        <td>{getMatchLabel(rec.matchId)}</td>
                        <td>
                          <strong>{getPlayerName(rec.playerId)}</strong>
                        </td>
                        {NEWCOM_METRICS.map((m) => {
                          const v = rec.metrics[m.key];
                          return (
                            <td key={m.key}>
                              {v === null || v === undefined ? (
                                <span className="badge badge-warning" title="Dato no registrado">
                                  N/D
                                </span>
                              ) : (
                                v
                              )}
                            </td>
                          );
                        })}
                        <td>
                          <div className="row-gap">
                            <button
                              className="btn btn-sm"
                              onClick={() => {
                                loadExistingStatIntoForm(rec.matchId, rec.playerId);
                                setViewMode('register');
                              }}
                            >
                              Corregir
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => deleteStat(rec.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Evaluaciones del entrenador */}
          <div className="card stack">
            <h2 className="card-title">Evaluaciones del entrenador</h2>
            <form onSubmit={handleAddEvaluation} className="form-grid">
              <div className="form-field">
                <label>Jugador</label>
                <select
                  className="select"
                  value={viewMode === 'individual' ? effectivePlayerId : evalPlayerId || teamPlayers[0]?.id || ''}
                  onChange={(e) => setEvalPlayerId(e.target.value)}
                  disabled={viewMode === 'individual'}
                >
                  {teamPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Fecha y puntaje (1-10, opcional)</label>
                <div className="row-gap">
                  <input
                    type="date"
                    className="input"
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="input"
                    style={{ width: 90 }}
                    placeholder="1-10"
                    value={evalRating}
                    onChange={(e) => setEvalRating(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-field full">
                <label>Observación de rendimiento *</label>
                <textarea
                  className="textarea"
                  required
                  placeholder="Aspectos técnicos, tácticos o actitudinales observados..."
                  value={evalSummary}
                  onChange={(e) => setEvalSummary(e.target.value)}
                />
              </div>
              <div className="form-field full">
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
                  <Plus size={14} /> Guardar evaluación
                </button>
              </div>
            </form>

            {teamEvaluations
              .filter((ev) => viewMode !== 'individual' || ev.playerId === effectivePlayerId)
              .map((ev) => (
                <div
                  key={ev.id}
                  className="row-between"
                  style={{ paddingTop: '0.6rem', borderTop: '1px solid var(--border)' }}
                >
                  <div>
                    <div className="row-gap">
                      <strong>{getPlayerName(ev.playerId)}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>{ev.date}</span>
                      {ev.rating !== null && (
                        <span className="badge badge-primary">Nota: {ev.rating}/10</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.88rem', marginTop: 2 }}>{ev.summary}</div>
                  </div>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => deleteEvaluation(ev.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
          </div>
        </>
      )}

      {/* TAB REGISTRO DE ESTADÍSTICAS */}
      {viewMode === 'register' && (
        <div className="card stack">
          <h2 className="card-title">Registrar o corregir estadísticas de partido</h2>
          {savedNotice && <div className="alert alert-info">{savedNotice}</div>}

          {teamMatches.length === 0 || teamPlayers.length === 0 ? (
            <div className="empty-state">
              Necesitás al menos un partido registrado y un jugador en el plantel para cargar estadísticas.
            </div>
          ) : (
            <form onSubmit={handleSaveStat} className="form-grid">
              <div className="form-field">
                <label>Partido *</label>
                <select
                  className="select"
                  value={formMatchId}
                  onChange={(e) => loadExistingStatIntoForm(e.target.value, formPlayerId)}
                >
                  {teamMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.date} — vs {m.rivalName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Jugador *</label>
                <select
                  className="select"
                  value={formPlayerId}
                  onChange={(e) => loadExistingStatIntoForm(formMatchId, e.target.value)}
                >
                  {teamPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number || '-'} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {NEWCOM_METRICS.map((def) => (
                <div key={def.key} className="form-field">
                  <label>{def.label} (vacío = no registrado)</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    placeholder="Sin dato"
                    value={formMetrics[def.key]}
                    onChange={(e) =>
                      setFormMetrics((prev) => ({ ...prev, [def.key]: e.target.value }))
                    }
                  />
                </div>
              ))}

              <div className="form-field full">
                <label>Notas del registro</label>
                <input
                  className="input"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej. Solo jugó el 1er y 2do set..."
                />
              </div>

              <div className="form-field full row-gap">
                <button type="submit" className="btn btn-primary">
                  Guardar registro
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setViewMode('collective')}
                >
                  Volver a resumen
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
