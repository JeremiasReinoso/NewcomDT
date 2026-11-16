import React, { useState } from 'react';
import { Edit2, Plus, Shield, Target, Trash2, Trophy } from 'lucide-react';
import { todayIsoDate } from '../../domain/ids';
import type { Match, MatchResult, Rival } from '../../domain/types';
import { useCoach } from '../../state/CoachContext';

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export const MatchesPage: React.FC = () => {
  const {
    activeTeam,
    teamMatches,
    teamRivals,
    upsertMatch,
    deleteMatch,
    upsertRival,
    deleteRival,
    upsertObjective,
  } = useCoach();

  const [tab, setTab] = useState<'matches' | 'rivals'>('matches');
  const [editingMatch, setEditingMatch] = useState<{
    id?: string;
    rivalId?: string;
    rivalName: string;
    date: string;
    competition: string;
    result: MatchResult;
    scoreSummary: string;
    generalNotes: string;
    strengthsText: string;
    weaknessesText: string;
    observationsText: string;
  } | null>(null);

  const [editingRival, setEditingRival] = useState<Partial<Rival> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!activeTeam) {
    return <div className="empty-state">Seleccioná o creá un equipo primero.</div>;
  }

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const openMatchForm = (m?: Match) => {
    if (m) {
      setEditingMatch({
        id: m.id,
        rivalId: m.rivalId,
        rivalName: m.rivalName,
        date: m.date,
        competition: m.competition,
        result: m.result,
        scoreSummary: m.scoreSummary,
        generalNotes: m.generalNotes,
        strengthsText: m.strengths.join('\n'),
        weaknessesText: m.weaknesses.join('\n'),
        observationsText: m.observations.join('\n'),
      });
    } else {
      setEditingMatch({
        rivalId: teamRivals[0]?.id,
        rivalName: teamRivals[0]?.name ?? '',
        date: todayIsoDate(),
        competition: '',
        result: 'sin_definir',
        scoreSummary: '',
        generalNotes: '',
        strengthsText: '',
        weaknessesText: '',
        observationsText: '',
      });
    }
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch || !editingMatch.rivalName.trim()) return;
    upsertMatch({
      id: editingMatch.id,
      teamId: activeTeam.id,
      rivalId: editingMatch.rivalId,
      rivalName: editingMatch.rivalName.trim(),
      date: editingMatch.date || todayIsoDate(),
      competition: editingMatch.competition.trim(),
      result: editingMatch.result,
      scoreSummary: editingMatch.scoreSummary.trim(),
      generalNotes: editingMatch.generalNotes.trim(),
      strengths: linesToArray(editingMatch.strengthsText),
      weaknesses: linesToArray(editingMatch.weaknessesText),
      observations: linesToArray(editingMatch.observationsText),
    });
    setEditingMatch(null);
  };

  const handleSaveRival = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRival?.name?.trim()) return;
    upsertRival({
      id: editingRival.id,
      teamId: activeTeam.id,
      name: editingRival.name.trim(),
      category: editingRival.category?.trim() || activeTeam.category,
      strengths: editingRival.strengths?.trim() || '',
      weaknesses: editingRival.weaknesses?.trim() || '',
      tacticalNotes: editingRival.tacticalNotes?.trim() || '',
    });
    setEditingRival(null);
  };

  const convertToObjective = (match: Match, text: string) => {
    upsertObjective({
      teamId: activeTeam.id,
      title: text,
      description: `Detectado en el partido vs ${match.rivalName} (${match.date}).`,
      sourceMatchId: match.id,
      sourceLabel: `Partido vs ${match.rivalName} (${match.date})`,
      status: 'pendiente',
    });
    notify(`Objetivo creado en Entrenamientos: "${text}"`);
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Análisis de Partidos y Rivales</h1>
          <p>
            Documentá encuentros, fortalezas y debilidades, y convertí observaciones en objetivos de entrenamiento.
          </p>
        </div>
        <div className="row-gap">
          {tab === 'matches' ? (
            <button className="btn btn-primary" onClick={() => openMatchForm()}>
              <Plus size={16} /> Registrar partido
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() =>
                setEditingRival({
                  name: '',
                  category: activeTeam.category,
                  strengths: '',
                  weaknesses: '',
                  tacticalNotes: '',
                })
              }
            >
              <Plus size={16} /> Nuevo rival
            </button>
          )}
        </div>
      </div>

      {toast && <div className="alert alert-info">{toast}</div>}

      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'matches' ? 'active' : ''}`}
          onClick={() => setTab('matches')}
        >
          <Trophy size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
          Partidos ({teamMatches.length})
        </button>
        <button
          className={`tab-btn ${tab === 'rivals' ? 'active' : ''}`}
          onClick={() => setTab('rivals')}
        >
          <Shield size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
          Rivales ({teamRivals.length})
        </button>
      </div>

      {/* TAB PARTIDOS */}
      {tab === 'matches' && (
        <div className="stack">
          {teamMatches.length === 0 ? (
            <div className="empty-state">Todavía no registraste partidos disputados.</div>
          ) : (
            teamMatches.map((m) => (
              <div key={m.id} className="card stack">
                <div className="row-between">
                  <div>
                    <div className="row-gap">
                      <strong style={{ fontSize: '1.08rem' }}>vs {m.rivalName}</strong>
                      <span
                        className={`badge ${
                          m.result === 'ganado'
                            ? 'badge-success'
                            : m.result === 'perdido'
                              ? 'badge-danger'
                              : 'badge-warning'
                        }`}
                      >
                        {m.result === 'ganado'
                          ? 'Ganado'
                          : m.result === 'perdido'
                            ? 'Perdido'
                            : m.result === 'empatado'
                              ? 'Empatado'
                              : 'Sin definir'}
                      </span>
                      {m.scoreSummary && <span className="badge">{m.scoreSummary}</span>}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {m.date} {m.competition ? `· ${m.competition}` : ''}
                    </div>
                  </div>
                  <div className="row-gap">
                    <button className="btn btn-sm" onClick={() => openMatchForm(m)}>
                      <Edit2 size={13} /> Editar
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => deleteMatch(m.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {m.generalNotes && (
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>{m.generalNotes}</p>
                )}

                <div className="grid-3">
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--success)' }}>
                      Fortalezas
                    </strong>
                    {m.strengths.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>—</div>
                    ) : (
                      <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', fontSize: '0.84rem' }}>
                        {m.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--danger)' }}>
                      Debilidades (convertibles a objetivo)
                    </strong>
                    {m.weaknesses.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>—</div>
                    ) : (
                      <div className="stack" style={{ marginTop: '0.35rem', gap: '0.4rem' }}>
                        {m.weaknesses.map((w, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '0.83rem',
                              padding: '0.4rem',
                              background: 'var(--surface-muted)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div>{w}</div>
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ marginTop: '0.35rem', padding: '0.2rem 0.5rem', fontSize: '0.74rem' }}
                              onClick={() => convertToObjective(m, w)}
                            >
                              <Target size={12} /> Convertir en objetivo
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>
                      Observaciones
                    </strong>
                    {m.observations.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>—</div>
                    ) : (
                      <div className="stack" style={{ marginTop: '0.35rem', gap: '0.4rem' }}>
                        {m.observations.map((obs, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '0.83rem',
                              padding: '0.4rem',
                              background: 'var(--surface-muted)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div>{obs}</div>
                            <button
                              className="btn btn-sm"
                              style={{ marginTop: '0.35rem', padding: '0.2rem 0.5rem', fontSize: '0.74rem' }}
                              onClick={() => convertToObjective(m, obs)}
                            >
                              <Target size={12} /> Crear objetivo
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB RIVALES */}
      {tab === 'rivals' && (
        <div className="grid-2">
          {teamRivals.length === 0 ? (
            <div className="empty-state">No hay rivales registrados todavía.</div>
          ) : (
            teamRivals.map((r) => {
              const history = teamMatches.filter(
                (m) => m.rivalId === r.id || m.rivalName.toLowerCase() === r.name.toLowerCase()
              );
              return (
                <div key={r.id} className="card stack">
                  <div className="row-between">
                    <div>
                      <strong>{r.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {r.category} · {history.length} enfrentamientos registrados
                      </div>
                    </div>
                    <div className="row-gap">
                      <button className="btn btn-sm" onClick={() => setEditingRival(r)}>
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => deleteRival(r.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {r.strengths && (
                    <div style={{ fontSize: '0.84rem' }}>
                      <strong>Fortalezas:</strong> {r.strengths}
                    </div>
                  )}
                  {r.weaknesses && (
                    <div style={{ fontSize: '0.84rem' }}>
                      <strong>Debilidades:</strong> {r.weaknesses}
                    </div>
                  )}
                  {r.tacticalNotes && (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      <strong>Notas tácticas:</strong> {r.tacticalNotes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Partido */}
      {editingMatch && (
        <div className="modal-backdrop" onClick={() => setEditingMatch(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              {editingMatch.id ? 'Editar partido' : 'Registrar partido'}
            </h2>
            <form onSubmit={handleSaveMatch} className="form-grid">
              <div className="form-field">
                <label>Rival registrado (opcional)</label>
                <select
                  className="select"
                  value={editingMatch.rivalId || ''}
                  onChange={(e) => {
                    const r = teamRivals.find((x) => x.id === e.target.value);
                    setEditingMatch({
                      ...editingMatch,
                      rivalId: r?.id,
                      rivalName: r ? r.name : editingMatch.rivalName,
                    });
                  }}
                >
                  <option value="">-- Escribir nombre manual --</option>
                  {teamRivals.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Nombre del rival *</label>
                <input
                  className="input"
                  required
                  value={editingMatch.rivalName}
                  onChange={(e) =>
                    setEditingMatch({ ...editingMatch, rivalName: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Fecha *</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={editingMatch.date}
                  onChange={(e) => setEditingMatch({ ...editingMatch, date: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Competencia / Torneo</label>
                <input
                  className="input"
                  value={editingMatch.competition}
                  onChange={(e) =>
                    setEditingMatch({ ...editingMatch, competition: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Resultado</label>
                <select
                  className="select"
                  value={editingMatch.result}
                  onChange={(e) =>
                    setEditingMatch({
                      ...editingMatch,
                      result: e.target.value as MatchResult,
                    })
                  }
                >
                  <option value="ganado">Ganado</option>
                  <option value="perdido">Perdido</option>
                  <option value="empatado">Empatado</option>
                  <option value="sin_definir">Sin definir</option>
                </select>
              </div>
              <div className="form-field">
                <label>Marcador / Sets</label>
                <input
                  className="input"
                  placeholder="Ej. 2 - 1 (15-12, 11-15, 15-10)"
                  value={editingMatch.scoreSummary}
                  onChange={(e) =>
                    setEditingMatch({ ...editingMatch, scoreSummary: e.target.value })
                  }
                />
              </div>
              <div className="form-field full">
                <label>Observaciones generales</label>
                <textarea
                  className="textarea"
                  value={editingMatch.generalNotes}
                  onChange={(e) =>
                    setEditingMatch({ ...editingMatch, generalNotes: e.target.value })
                  }
                />
              </div>
              <div className="form-field full">
                <label>Fortalezas (una por línea)</label>
                <textarea
                  className="textarea"
                  value={editingMatch.strengthsText}
                  onChange={(e) =>
                    setEditingMatch({ ...editingMatch, strengthsText: e.target.value })
                  }
                />
              </div>
              <div className="form-field full">
                <label>Debilidades (una por línea)</label>
                <textarea
                  className="textarea"
                  value={editingMatch.weaknessesText}
                  onChange={(e) =>
                    setEditingMatch({ ...editingMatch, weaknessesText: e.target.value })
                  }
                />
              </div>
              <div className="form-field full">
                <label>Observaciones tácticas (una por línea)</label>
                <textarea
                  className="textarea"
                  value={editingMatch.observationsText}
                  onChange={(e) =>
                    setEditingMatch({ ...editingMatch, observationsText: e.target.value })
                  }
                />
              </div>
              <div className="form-field full row-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditingMatch(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar partido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rival */}
      {editingRival && (
        <div className="modal-backdrop" onClick={() => setEditingRival(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{editingRival.id ? 'Editar rival' : 'Nuevo rival'}</h2>
            <form onSubmit={handleSaveRival} className="stack">
              <div className="form-field">
                <label>Nombre del equipo rival *</label>
                <input
                  className="input"
                  required
                  value={editingRival.name || ''}
                  onChange={(e) => setEditingRival({ ...editingRival, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Categoría</label>
                <input
                  className="input"
                  value={editingRival.category || ''}
                  onChange={(e) => setEditingRival({ ...editingRival, category: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Fortalezas identificadas</label>
                <textarea
                  className="textarea"
                  value={editingRival.strengths || ''}
                  onChange={(e) => setEditingRival({ ...editingRival, strengths: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Debilidades identificadas</label>
                <textarea
                  className="textarea"
                  value={editingRival.weaknesses || ''}
                  onChange={(e) => setEditingRival({ ...editingRival, weaknesses: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Notas tácticas</label>
                <textarea
                  className="textarea"
                  value={editingRival.tacticalNotes || ''}
                  onChange={(e) =>
                    setEditingRival({ ...editingRival, tacticalNotes: e.target.value })
                  }
                />
              </div>
              <div className="row-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditingRival(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar rival
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
