import React, { useState } from 'react';
import { Edit2, Plus, Trash2, Users } from 'lucide-react';
import { useCoach } from '../../state/CoachContext';
import type { Player, Team } from '../../domain/types';

export const TeamsPage: React.FC = () => {
  const {
    db,
    activeTeam,
    teamPlayers,
    setActiveTeam,
    upsertTeam,
    deleteTeam,
    upsertPlayer,
    deletePlayer,
  } = useCoach();

  const [editingTeam, setEditingTeam] = useState<Partial<Team> | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player> | null>(null);

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam?.name?.trim()) return;
    upsertTeam({
      id: editingTeam.id,
      name: editingTeam.name.trim(),
      category: editingTeam.category?.trim() || 'General',
      season: editingTeam.season?.trim() || new Date().getFullYear().toString(),
      coachName: editingTeam.coachName?.trim() || 'DT',
      notes: editingTeam.notes?.trim() || '',
    });
    setEditingTeam(null);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !editingPlayer?.name?.trim()) return;
    upsertPlayer({
      id: editingPlayer.id,
      teamId: activeTeam.id,
      name: editingPlayer.name.trim(),
      number: editingPlayer.number?.trim() || '',
      role: editingPlayer.role?.trim() || 'Polifuncional',
      active: editingPlayer.active ?? true,
      notes: editingPlayer.notes?.trim() || '',
    });
    setEditingPlayer(null);
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Equipos y Plantel</h1>
          <p>Administrá tus equipos de Newcom y la nómina de jugadores con aislamiento por equipo.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() =>
            setEditingTeam({ name: '', category: '+60 Mixto', season: '2026', coachName: '', notes: '' })
          }
        >
          <Plus size={16} /> Nuevo equipo
        </button>
      </div>

      {/* Lista de equipos */}
      <div className="grid-3">
        {db.teams.map((team) => {
          const isCurrent = activeTeam?.id === team.id;
          const count = db.players.filter((p) => p.teamId === team.id).length;
          return (
            <div
              key={team.id}
              className="card"
              style={{
                borderColor: isCurrent ? 'var(--primary)' : undefined,
                borderWidth: isCurrent ? '2px' : '1px',
              }}
            >
              <div className="row-between">
                <strong>{team.name}</strong>
                {isCurrent && <span className="badge badge-primary">Activo</span>}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {team.category} · Temporada {team.season} · {count} jugadores
              </div>
              {team.notes && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)', margin: '0.5rem 0 0' }}>
                  {team.notes}
                </p>
              )}
              <div className="row-gap" style={{ marginTop: '0.85rem' }}>
                {!isCurrent && (
                  <button className="btn btn-sm btn-primary" onClick={() => setActiveTeam(team.id)}>
                    Seleccionar
                  </button>
                )}
                <button className="btn btn-sm" onClick={() => setEditingTeam(team)}>
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar el equipo "${team.name}" y todos sus datos?`)) {
                      deleteTeam(team.id);
                    }
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plantel del equipo activo */}
      {activeTeam && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title row-gap">
              <Users size={18} /> Jugadores de {activeTeam.name}
            </h2>
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                setEditingPlayer({ name: '', number: '', role: '', active: true, notes: '' })
              }
            >
              <Plus size={15} /> Agregar jugador
            </button>
          </div>

          {teamPlayers.length === 0 ? (
            <div className="empty-state">
              Este equipo aún no tiene jugadores cargados.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Nombre</th>
                    <th>Rol / Posición habitual</th>
                    <th>Estado</th>
                    <th>Observaciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPlayers.map((pl) => (
                    <tr key={pl.id}>
                      <td>
                        <span className="badge badge-primary">#{pl.number || '-'}</span>
                      </td>
                      <td>
                        <strong>{pl.name}</strong>
                      </td>
                      <td>{pl.role || '—'}</td>
                      <td>
                        <span className={`badge ${pl.active ? 'badge-success' : ''}`}>
                          {pl.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: '280px' }}>
                        {pl.notes || '—'}
                      </td>
                      <td>
                        <div className="row-gap">
                          <button
                            className="btn btn-sm"
                            onClick={() => setEditingPlayer(pl)}
                            title="Editar jugador"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar a ${pl.name}?`)) {
                                deletePlayer(pl.id);
                              }
                            }}
                            title="Eliminar jugador"
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
      )}

      {/* Modal Equipo */}
      {editingTeam && (
        <div className="modal-backdrop" onClick={() => setEditingTeam(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              {editingTeam.id ? 'Editar equipo' : 'Nuevo equipo'}
            </h2>
            <form onSubmit={handleSaveTeam} className="form-grid">
              <div className="form-field full">
                <label>Nombre del equipo *</label>
                <input
                  className="input"
                  required
                  value={editingTeam.name || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Categoría</label>
                <input
                  className="input"
                  placeholder="Ej. +50 Mixto, +60 Femenino"
                  value={editingTeam.category || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, category: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Temporada</label>
                <input
                  className="input"
                  value={editingTeam.season || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, season: e.target.value })}
                />
              </div>
              <div className="form-field full">
                <label>Entrenador / DT</label>
                <input
                  className="input"
                  value={editingTeam.coachName || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, coachName: e.target.value })}
                />
              </div>
              <div className="form-field full">
                <label>Observaciones</label>
                <textarea
                  className="textarea"
                  value={editingTeam.notes || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, notes: e.target.value })}
                />
              </div>
              <div className="form-field full row-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditingTeam(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Jugador */}
      {editingPlayer && (
        <div className="modal-backdrop" onClick={() => setEditingPlayer(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              {editingPlayer.id ? 'Editar jugador' : 'Agregar jugador'}
            </h2>
            <form onSubmit={handleSavePlayer} className="form-grid">
              <div className="form-field">
                <label>Nombre completo *</label>
                <input
                  className="input"
                  required
                  value={editingPlayer.name || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Número de camiseta</label>
                <input
                  className="input"
                  value={editingPlayer.number || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, number: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Rol / Posición habitual</label>
                <input
                  className="input"
                  placeholder="Ej. Armador, Zaguero, Delantero"
                  value={editingPlayer.role || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Estado</label>
                <select
                  className="select"
                  value={editingPlayer.active === false ? 'false' : 'true'}
                  onChange={(e) =>
                    setEditingPlayer({ ...editingPlayer, active: e.target.value === 'true' })
                  }
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
              <div className="form-field full">
                <label>Observaciones deportivas</label>
                <textarea
                  className="textarea"
                  value={editingPlayer.notes || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, notes: e.target.value })}
                />
              </div>
              <div className="form-field full row-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditingPlayer(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar jugador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
