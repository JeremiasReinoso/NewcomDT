import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ClipboardCheck,
  Dumbbell,
  Edit2,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { createId, todayIsoDate } from '../../domain/ids';
import type {
  Exercise,
  ExerciseDifficulty,
  ObjectiveStatus,
  SessionExercise,
  TrainingObjective,
  TrainingSession,
} from '../../domain/types';
import { useCoach } from '../../state/CoachContext';

type TrainingTab = 'sessions' | 'exercises' | 'objectives';

export const TrainingsPage: React.FC = () => {
  const {
    db,
    activeTeam,
    teamExercises,
    teamSessions,
    teamObjectives,
    addExerciseCategory,
    upsertExercise,
    deleteExercise,
    upsertSession,
    deleteSession,
    upsertObjective,
    deleteObjective,
  } = useCoach();

  const [tab, setTab] = useState<TrainingTab>('sessions');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [newCategoryName, setNewCategoryName] = useState('');

  const [editingExercise, setEditingExercise] = useState<Partial<Exercise> | null>(null);
  const [editingSession, setEditingSession] = useState<Partial<TrainingSession> | null>(null);
  const [completingSession, setCompletingSession] = useState<TrainingSession | null>(null);
  const [editingObjective, setEditingObjective] = useState<Partial<TrainingObjective> | null>(null);

  if (!activeTeam) {
    return <div className="empty-state">Seleccioná o creá un equipo primero.</div>;
  }

  const filteredExercises =
    categoryFilter === 'Todas'
      ? teamExercises
      : teamExercises.filter((e) => e.category === categoryFilter);

  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise?.name?.trim()) return;
    upsertExercise({
      id: editingExercise.id,
      teamId: activeTeam.id,
      name: editingExercise.name.trim(),
      description: editingExercise.description?.trim() || '',
      objective: editingExercise.objective?.trim() || '',
      category: editingExercise.category || db.exerciseCategories[0] || 'Técnica',
      difficulty: (editingExercise.difficulty as ExerciseDifficulty) || 'Básico',
      estimatedMinutes: Number(editingExercise.estimatedMinutes) || 15,
      materials: editingExercise.materials?.trim() || '',
      indications: editingExercise.indications?.trim() || '',
      notes: editingExercise.notes?.trim() || '',
    });
    setEditingExercise(null);
  };

  const openNewSession = (objective?: TrainingObjective) => {
    setEditingSession({
      name: objective ? `Sesión: ${objective.title}` : '',
      date: todayIsoDate(),
      objectiveId: objective?.id,
      objectiveText: objective?.title || '',
      exercises: [],
      plannedMinutes: 45,
      status: 'planificada',
      plannedNotes: '',
    });
  };

  const addExerciseToSessionForm = (exerciseId: string) => {
    if (!editingSession) return;
    const ex = teamExercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    const current = editingSession.exercises ?? [];
    const nextItem: SessionExercise = {
      id: createId('se'),
      exerciseId: ex.id,
      order: current.length + 1,
      plannedMinutes: ex.estimatedMinutes,
      completed: false,
    };
    const nextList = [...current, nextItem];
    const total = nextList.reduce((acc, item) => acc + item.plannedMinutes, 0);
    setEditingSession({ ...editingSession, exercises: nextList, plannedMinutes: total });
  };

  const moveSessionExercise = (idx: number, delta: -1 | 1) => {
    if (!editingSession?.exercises) return;
    const list = [...editingSession.exercises];
    const target = idx + delta;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    setEditingSession({
      ...editingSession,
      exercises: list.map((item, i) => ({ ...item, order: i + 1 })),
    });
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession?.name?.trim()) return;
    const list = editingSession.exercises ?? [];
    upsertSession({
      id: editingSession.id,
      teamId: activeTeam.id,
      name: editingSession.name.trim(),
      date: editingSession.date || todayIsoDate(),
      objectiveId: editingSession.objectiveId,
      objectiveText: editingSession.objectiveText?.trim() || '',
      exercises: list,
      plannedMinutes:
        Number(editingSession.plannedMinutes) ||
        list.reduce((acc, item) => acc + item.plannedMinutes, 0),
      actualMinutes: editingSession.actualMinutes,
      status: editingSession.status || 'planificada',
      plannedNotes: editingSession.plannedNotes?.trim() || '',
      actualNotes: editingSession.actualNotes,
      improvementsNeeded: editingSession.improvementsNeeded,
      completedAt: editingSession.completedAt,
    });
    setEditingSession(null);
  };

  const handleCompleteSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingSession) return;
    upsertSession({
      ...completingSession,
      status: 'realizada',
      completedAt: completingSession.completedAt || new Date().toISOString(),
    });
    setCompletingSession(null);
  };

  const handleSaveObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObjective?.title?.trim()) return;
    upsertObjective({
      id: editingObjective.id,
      teamId: activeTeam.id,
      title: editingObjective.title.trim(),
      description: editingObjective.description?.trim() || '',
      sourceMatchId: editingObjective.sourceMatchId,
      sourceLabel: editingObjective.sourceLabel,
      status: (editingObjective.status as ObjectiveStatus) || 'pendiente',
    });
    setEditingObjective(null);
  };

  const getExerciseName = (exerciseId: string) =>
    teamExercises.find((e) => e.id === exerciseId)?.name ?? 'Ejercicio eliminado';

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Planificación de Entrenamientos</h1>
          <p>
            Organizá tu biblioteca de ejercicios, planificá sesiones y registrá lo efectivamente trabajado.
          </p>
        </div>
        <div className="row-gap">
          <button className="btn btn-primary" onClick={() => openNewSession()}>
            <Plus size={16} /> Crear sesión
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`}
          onClick={() => setTab('sessions')}
        >
          <ClipboardCheck size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
          Sesiones ({teamSessions.length})
        </button>
        <button
          className={`tab-btn ${tab === 'exercises' ? 'active' : ''}`}
          onClick={() => setTab('exercises')}
        >
          <Dumbbell size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
          Biblioteca de ejercicios ({teamExercises.length})
        </button>
        <button
          className={`tab-btn ${tab === 'objectives' ? 'active' : ''}`}
          onClick={() => setTab('objectives')}
        >
          <Target size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
          Objetivos deportivos ({teamObjectives.length})
        </button>
      </div>

      {/* TAB SESIONES */}
      {tab === 'sessions' && (
        <div className="stack">
          {teamSessions.length === 0 ? (
            <div className="empty-state">
              No hay sesiones registradas. Creá una nueva sesión para comenzar.
            </div>
          ) : (
            teamSessions.map((ses) => (
              <div key={ses.id} className="card stack">
                <div className="row-between">
                  <div>
                    <div className="row-gap">
                      <strong style={{ fontSize: '1.05rem' }}>{ses.name}</strong>
                      <span
                        className={`badge ${
                          ses.status === 'realizada' ? 'badge-success' : 'badge-primary'
                        }`}
                      >
                        {ses.status === 'realizada' ? 'Realizada' : 'Planificada'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Fecha: <strong>{ses.date}</strong> · Planificado: {ses.plannedMinutes} min
                      {ses.status === 'realizada' && ses.actualMinutes !== undefined
                        ? ` · Real: ${ses.actualMinutes} min`
                        : ''}
                    </div>
                  </div>
                  <div className="row-gap">
                    {ses.status === 'planificada' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() =>
                          setCompletingSession({
                            ...ses,
                            actualMinutes: ses.actualMinutes ?? ses.plannedMinutes,
                            actualNotes: ses.actualNotes ?? '',
                            improvementsNeeded: ses.improvementsNeeded ?? '',
                          })
                        }
                      >
                        <CheckCircle2 size={14} /> Registrar realizada
                      </button>
                    )}
                    <button className="btn btn-sm" onClick={() => setEditingSession(ses)}>
                      <Edit2 size={13} /> Editar
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => deleteSession(ses.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {ses.objectiveText && (
                  <div className="alert alert-info">
                    <strong>Objetivo:</strong> {ses.objectiveText}
                  </div>
                )}

                {ses.exercises.length > 0 && (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Orden</th>
                          <th>Ejercicio</th>
                          <th>Duración est.</th>
                          {ses.status === 'realizada' && <th>Completado</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {ses.exercises.map((item) => (
                          <tr key={item.id}>
                            <td>#{item.order}</td>
                            <td>{getExerciseName(item.exerciseId)}</td>
                            <td>{item.plannedMinutes} min</td>
                            {ses.status === 'realizada' && (
                              <td>
                                <span
                                  className={`badge ${
                                    item.completed ? 'badge-success' : 'badge-warning'
                                  }`}
                                >
                                  {item.completed ? 'Completado' : 'No realizado'}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {ses.plannedNotes && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Notas planificadas:</strong> {ses.plannedNotes}
                  </div>
                )}

                {ses.status === 'realizada' && (
                  <div
                    className="stack"
                    style={{
                      background: 'var(--surface-muted)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <strong style={{ fontSize: '0.85rem' }}>Registro posterior al entrenamiento</strong>
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>Observaciones reales:</strong> {ses.actualNotes || 'Sin observaciones.'}
                    </div>
                    {ses.improvementsNeeded && (
                      <div style={{ fontSize: '0.85rem' }}>
                        <strong>Aspectos a mejorar:</strong> {ses.improvementsNeeded}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB EJERCICIOS */}
      {tab === 'exercises' && (
        <div className="stack">
          <div className="card row-between">
            <div className="row-gap">
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Categoría:</label>
              <select
                className="select"
                style={{ width: 'auto' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="Todas">Todas</option>
                {db.exerciseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                className="input"
                style={{ width: 175 }}
                placeholder="Nueva categoría..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                className="btn btn-sm"
                onClick={() => {
                  addExerciseCategory(newCategoryName);
                  setNewCategoryName('');
                }}
              >
                Agregar categoría
              </button>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                setEditingExercise({
                  name: '',
                  description: '',
                  objective: '',
                  category: db.exerciseCategories[0] || 'Técnica',
                  difficulty: 'Básico',
                  estimatedMinutes: 15,
                  materials: '',
                  indications: '',
                  notes: '',
                })
              }
            >
              <Plus size={14} /> Nuevo ejercicio
            </button>
          </div>

          {filteredExercises.length === 0 ? (
            <div className="empty-state">No hay ejercicios en esta categoría.</div>
          ) : (
            <div className="grid-2">
              {filteredExercises.map((ex) => (
                <div key={ex.id} className="card stack">
                  <div className="row-between">
                    <strong>{ex.name}</strong>
                    <div className="row-gap">
                      <span className="badge badge-primary">{ex.category}</span>
                      <span className="badge">{ex.difficulty}</span>
                      <span className="badge">{ex.estimatedMinutes} min</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    {ex.description}
                  </p>
                  {ex.objective && (
                    <div style={{ fontSize: '0.82rem' }}>
                      <strong>Objetivo:</strong> {ex.objective}
                    </div>
                  )}
                  {ex.materials && (
                    <div style={{ fontSize: '0.82rem' }}>
                      <strong>Materiales:</strong> {ex.materials}
                    </div>
                  )}
                  {ex.indications && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <strong>Indicaciones:</strong> {ex.indications}
                    </div>
                  )}
                  <div className="row-gap">
                    <button className="btn btn-sm" onClick={() => setEditingExercise(ex)}>
                      <Edit2 size={13} /> Editar
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => deleteExercise(ex.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB OBJETIVOS */}
      {tab === 'objectives' && (
        <div className="stack">
          <div className="row-between">
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Conectá observaciones de partidos con objetivos de entrenamiento y evaluá su avance.
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                setEditingObjective({ title: '', description: '', status: 'pendiente' })
              }
            >
              <Plus size={14} /> Nuevo objetivo
            </button>
          </div>

          {teamObjectives.length === 0 ? (
            <div className="empty-state">No hay objetivos creados aún.</div>
          ) : (
            <div className="grid-2">
              {teamObjectives.map((obj) => (
                <div key={obj.id} className="card stack">
                  <div className="row-between">
                    <strong>{obj.title}</strong>
                    <select
                      className="select"
                      style={{ width: 'auto' }}
                      value={obj.status}
                      onChange={(e) =>
                        upsertObjective({
                          ...obj,
                          status: e.target.value as ObjectiveStatus,
                        })
                      }
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_progreso">En progreso</option>
                      <option value="logrado">Logrado</option>
                    </select>
                  </div>
                  {obj.description && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {obj.description}
                    </p>
                  )}
                  {obj.sourceLabel && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)' }}>
                      Origen: {obj.sourceLabel}
                    </div>
                  )}
                  <div className="row-gap">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setTab('sessions');
                        openNewSession(obj);
                      }}
                    >
                      <Plus size={13} /> Planificar sesión
                    </button>
                    <button className="btn btn-sm" onClick={() => setEditingObjective(obj)}>
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => deleteObjective(obj.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Ejercicio */}
      {editingExercise && (
        <div className="modal-backdrop" onClick={() => setEditingExercise(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              {editingExercise.id ? 'Editar ejercicio' : 'Nuevo ejercicio'}
            </h2>
            <form onSubmit={handleSaveExercise} className="form-grid">
              <div className="form-field full">
                <label>Nombre *</label>
                <input
                  className="input"
                  required
                  value={editingExercise.name || ''}
                  onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Categoría</label>
                <select
                  className="select"
                  value={editingExercise.category || db.exerciseCategories[0]}
                  onChange={(e) =>
                    setEditingExercise({ ...editingExercise, category: e.target.value })
                  }
                >
                  {db.exerciseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Dificultad</label>
                <select
                  className="select"
                  value={editingExercise.difficulty || 'Básico'}
                  onChange={(e) =>
                    setEditingExercise({
                      ...editingExercise,
                      difficulty: e.target.value as ExerciseDifficulty,
                    })
                  }
                >
                  <option value="Básico">Básico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>
              <div className="form-field">
                <label>Duración estimada (min)</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={editingExercise.estimatedMinutes ?? 15}
                  onChange={(e) =>
                    setEditingExercise({
                      ...editingExercise,
                      estimatedMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-field">
                <label>Materiales necesarios</label>
                <input
                  className="input"
                  value={editingExercise.materials || ''}
                  onChange={(e) =>
                    setEditingExercise({ ...editingExercise, materials: e.target.value })
                  }
                />
              </div>
              <div className="form-field full">
                <label>Objetivo</label>
                <input
                  className="input"
                  value={editingExercise.objective || ''}
                  onChange={(e) =>
                    setEditingExercise({ ...editingExercise, objective: e.target.value })
                  }
                />
              </div>
              <div className="form-field full">
                <label>Descripción</label>
                <textarea
                  className="textarea"
                  value={editingExercise.description || ''}
                  onChange={(e) =>
                    setEditingExercise({ ...editingExercise, description: e.target.value })
                  }
                />
              </div>
              <div className="form-field full">
                <label>Indicaciones y observaciones</label>
                <textarea
                  className="textarea"
                  value={editingExercise.indications || ''}
                  onChange={(e) =>
                    setEditingExercise({ ...editingExercise, indications: e.target.value })
                  }
                />
              </div>
              <div className="form-field full row-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditingExercise(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar ejercicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sesión (Planificación) */}
      {editingSession && (
        <div className="modal-backdrop" onClick={() => setEditingSession(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              {editingSession.id ? 'Editar sesión' : 'Crear sesión de entrenamiento'}
            </h2>
            <form onSubmit={handleSaveSession} className="form-grid">
              <div className="form-field">
                <label>Nombre de la sesión *</label>
                <input
                  className="input"
                  required
                  value={editingSession.name || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Fecha *</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={editingSession.date || todayIsoDate()}
                  onChange={(e) => setEditingSession({ ...editingSession, date: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Vincular a objetivo deportivo</label>
                <select
                  className="select"
                  value={editingSession.objectiveId || ''}
                  onChange={(e) => {
                    const obj = teamObjectives.find((o) => o.id === e.target.value);
                    setEditingSession({
                      ...editingSession,
                      objectiveId: obj?.id,
                      objectiveText: obj ? obj.title : editingSession.objectiveText || '',
                    });
                  }}
                >
                  <option value="">-- Ninguno / personalizado --</option>
                  {teamObjectives.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Duración total estimada (min)</label>
                <input
                  type="number"
                  min={5}
                  className="input"
                  value={editingSession.plannedMinutes ?? 45}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      plannedMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-field full">
                <label>Objetivo de la sesión</label>
                <input
                  className="input"
                  value={editingSession.objectiveText || ''}
                  onChange={(e) =>
                    setEditingSession({ ...editingSession, objectiveText: e.target.value })
                  }
                />
              </div>
              <div className="form-field full">
                <label>Incorporar ejercicios de la biblioteca</label>
                <select
                  className="select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addExerciseToSessionForm(e.target.value);
                  }}
                >
                  <option value="">+ Seleccionar ejercicio...</option>
                  {teamExercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.estimatedMinutes} min)
                    </option>
                  ))}
                </select>
                {(editingSession.exercises ?? []).length > 0 && (
                  <div className="stack" style={{ marginTop: '0.5rem' }}>
                    {(editingSession.exercises ?? []).map((item, idx) => (
                      <div
                        key={item.id}
                        className="row-between"
                        style={{
                          padding: '0.4rem 0.6rem',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem' }}>
                          {idx + 1}. {getExerciseName(item.exerciseId)} ({item.plannedMinutes} min)
                        </span>
                        <div className="row-gap">
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => moveSessionExercise(idx, -1)}
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => moveSessionExercise(idx, 1)}
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() =>
                              setEditingSession({
                                ...editingSession,
                                exercises: (editingSession.exercises ?? [])
                                  .filter((x) => x.id !== item.id)
                                  .map((x, i) => ({ ...x, order: i + 1 })),
                              })
                            }
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-field full">
                <label>Observaciones planificadas</label>
                <textarea
                  className="textarea"
                  value={editingSession.plannedNotes || ''}
                  onChange={(e) =>
                    setEditingSession({ ...editingSession, plannedNotes: e.target.value })
                  }
                />
              </div>
              <div className="form-field full row-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditingSession(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Entrenamiento Realizado */}
      {completingSession && (
        <div className="modal-backdrop" onClick={() => setCompletingSession(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Registrar entrenamiento realizado</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Sesión: <strong>{completingSession.name}</strong> ({completingSession.date})
            </p>
            <form onSubmit={handleCompleteSession} className="stack">
              {completingSession.exercises.length > 0 && (
                <div className="form-field">
                  <label>Ejercicios efectivamente completados</label>
                  <div className="stack">
                    {completingSession.exercises.map((item) => (
                      <label key={item.id} className="row-gap" style={{ fontWeight: 400 }}>
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) =>
                            setCompletingSession({
                              ...completingSession,
                              exercises: completingSession.exercises.map((x) =>
                                x.id === item.id ? { ...x, completed: e.target.checked } : x
                              ),
                            })
                          }
                        />
                        {getExerciseName(item.exerciseId)} ({item.plannedMinutes} min plan.)
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="form-field">
                <label>Duración real (minutos)</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={completingSession.actualMinutes ?? completingSession.plannedMinutes}
                  onChange={(e) =>
                    setCompletingSession({
                      ...completingSession,
                      actualMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-field">
                <label>Observaciones reales de la sesión</label>
                <textarea
                  className="textarea"
                  value={completingSession.actualNotes || ''}
                  onChange={(e) =>
                    setCompletingSession({ ...completingSession, actualNotes: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Aspectos que necesitan mejorar</label>
                <textarea
                  className="textarea"
                  value={completingSession.improvementsNeeded || ''}
                  onChange={(e) =>
                    setCompletingSession({
                      ...completingSession,
                      improvementsNeeded: e.target.value,
                    })
                  }
                />
              </div>
              <div className="row-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setCompletingSession(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Confirmar sesión realizada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Objetivo */}
      {editingObjective && (
        <div className="modal-backdrop" onClick={() => setEditingObjective(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              {editingObjective.id ? 'Editar objetivo' : 'Nuevo objetivo deportivo'}
            </h2>
            <form onSubmit={handleSaveObjective} className="stack">
              <div className="form-field">
                <label>Título del objetivo *</label>
                <input
                  className="input"
                  required
                  value={editingObjective.title || ''}
                  onChange={(e) =>
                    setEditingObjective({ ...editingObjective, title: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  className="textarea"
                  value={editingObjective.description || ''}
                  onChange={(e) =>
                    setEditingObjective({ ...editingObjective, description: e.target.value })
                  }
                />
              </div>
              <div className="row-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditingObjective(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
