import React, { useState } from 'react';
import {
  Copy,
  Layers,
  MousePointer,
  MoveRight,
  Plus,
  Save,
  Square,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { createId } from '../../domain/ids';
import type {
  CourtPoint,
  Formation,
  FormationPlayer,
  MovementKind,
  Play,
  TacticalMovement,
  TacticalZone,
} from '../../domain/types';
import { useCoach } from '../../state/CoachContext';
import { MOVEMENT_COLORS, TacticalCourt, type CourtTool } from '../../tactical-board/TacticalCourt';

type EditorMode = 'formation' | 'play';

export const StrategiesPage: React.FC = () => {
  const {
    activeTeam,
    teamPlayers,
    teamFormations,
    teamPlays,
    saveFormation,
    duplicateFormation,
    deleteFormation,
    savePlay,
    deletePlay,
  } = useCoach();

  const [mode, setMode] = useState<EditorMode>('play');
  const [tool, setTool] = useState<CourtTool>('select');
  const [movementKind, setMovementKind] = useState<MovementKind>('pass');
  const [zoneLabel, setZoneLabel] = useState('Zona objetivo');
  const [zoneColor, setZoneColor] = useState('#f59e0b');

  // Estado del lienzo táctico (siempre aislado hasta guardar explícitamente)
  const [editingFormationId, setEditingFormationId] = useState<string | undefined>(undefined);
  const [editingPlayId, setEditingPlayId] = useState<string | undefined>(undefined);
  const [linkedFormationId, setLinkedFormationId] = useState<string | undefined>(undefined);
  const [linkedFormationName, setLinkedFormationName] = useState<string | undefined>(undefined);

  const [title, setTitle] = useState('Nueva jugada táctica');
  const [categoryOrObjective, setCategoryOrObjective] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [notes, setNotes] = useState('');

  const [players, setPlayers] = useState<FormationPlayer[]>(() =>
    teamFormations[0]?.players.map((p) => ({ ...p })) ?? []
  );
  const [movements, setMovements] = useState<TacticalMovement[]>([]);
  const [zones, setZones] = useState<TacticalZone[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  if (!activeTeam) {
    return <div className="empty-state">Seleccioná o creá un equipo primero.</div>;
  }

  const notify = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2600);
  };

  const loadFormationIntoEditor = (f: Formation, targetMode: EditorMode) => {
    setMode(targetMode);
    setPlayers(f.players.map((p) => ({ ...p })));
    setSelectedPlayerId(null);
    if (targetMode === 'formation') {
      setEditingFormationId(f.id);
      setEditingPlayId(undefined);
      setMovements([]);
      setZones([]);
      setTitle(f.name);
      setCategoryOrObjective(f.category);
      setTagsText(f.tags.join(', '));
      setNotes(f.notes);
      setDescription('');
    } else {
      // Reutilizar formación como base de una jugada sin modificar la formación original
      setEditingFormationId(undefined);
      setEditingPlayId(undefined);
      setLinkedFormationId(f.id);
      setLinkedFormationName(f.name);
      setMovements([]);
      setZones([]);
      setTitle(`Jugada desde ${f.name}`);
      setCategoryOrObjective('');
      setDescription('');
      setNotes('');
    }
  };

  const loadPlayIntoEditor = (play: Play) => {
    setMode('play');
    setEditingPlayId(play.id);
    setEditingFormationId(undefined);
    setLinkedFormationId(play.formationId);
    setLinkedFormationName(play.formationNameSnapshot);
    setPlayers(play.players.map((p) => ({ ...p })));
    setMovements(play.movements.map((m) => ({ ...m, from: { ...m.from }, to: { ...m.to } })));
    setZones(play.zones.map((z) => ({ ...z })));
    setTitle(play.name);
    setDescription(play.description);
    setCategoryOrObjective(play.tacticalObjective);
    setNotes(play.notes);
    setSelectedPlayerId(null);
  };

  const handleNewBlank = (targetMode: EditorMode) => {
    setMode(targetMode);
    setEditingFormationId(undefined);
    setEditingPlayId(undefined);
    setLinkedFormationId(undefined);
    setLinkedFormationName(undefined);
    setPlayers([]);
    setMovements([]);
    setZones([]);
    setTitle(targetMode === 'formation' ? 'Nueva formación' : 'Nueva jugada');
    setCategoryOrObjective('');
    setDescription('');
    setTagsText('');
    setNotes('');
    setSelectedPlayerId(null);
  };

  const handleAddRosterPlayer = (playerId: string) => {
    const roster = teamPlayers.find((p) => p.id === playerId);
    if (!roster) return;
    const offset = (players.length % 5) * 8;
    const newToken: FormationPlayer = {
      id: createId('fp'),
      playerId: roster.id,
      label: roster.name.split(' ')[0],
      number: roster.number || '?',
      x: Math.min(84, 24 + offset),
      y: 56 + (players.length % 2 === 0 ? 0 : 12),
      color: '#0284c7',
    };
    setPlayers((prev) => [...prev, newToken]);
    setSelectedPlayerId(newToken.id);
  };

  const handleAddGenericPlayer = () => {
    const idx = players.length + 1;
    const newToken: FormationPlayer = {
      id: createId('fp'),
      label: `J${idx}`,
      number: String(idx),
      x: 50,
      y: 58,
      color: '#0f766e',
    };
    setPlayers((prev) => [...prev, newToken]);
    setSelectedPlayerId(newToken.id);
  };

  const handleMovePlayer = (id: string, x: number, y: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
  };

  const handleAddMovement = (from: CourtPoint, to: CourtPoint) => {
    setMovements((prev) => [
      ...prev,
      {
        id: createId('mv'),
        kind: movementKind,
        from,
        to,
        label: MOVEMENT_COLORS[movementKind].label,
      },
    ]);
  };

  const handleAddZone = (zone: Omit<TacticalZone, 'id'>) => {
    setZones((prev) => [...prev, { ...zone, id: createId('zn') }]);
  };

  const handleSaveCurrent = (asNewCopy = false) => {
    if (!title.trim()) return;
    if (mode === 'formation') {
      const saved = saveFormation({
        id: asNewCopy ? undefined : editingFormationId,
        teamId: activeTeam.id,
        name: asNewCopy ? `${title.trim()} (Copia)` : title.trim(),
        category: categoryOrObjective.trim() || 'General',
        tags: tagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        players,
        notes: notes.trim(),
      });
      setEditingFormationId(saved.id);
      notify('Formación guardada correctamente.');
    } else {
      const saved = savePlay({
        id: asNewCopy ? undefined : editingPlayId,
        teamId: activeTeam.id,
        name: asNewCopy ? `${title.trim()} (Copia)` : title.trim(),
        description: description.trim(),
        formationId: linkedFormationId,
        formationNameSnapshot: linkedFormationName,
        players,
        movements,
        zones,
        tacticalObjective: categoryOrObjective.trim(),
        notes: notes.trim(),
      });
      setEditingPlayId(saved.id);
      notify('Jugada guardada en la biblioteca.');
    }
  };

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) ?? null;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Estrategias y Formaciones</h1>
          <p>
            Cancha táctica interactiva para diseñar formaciones y jugadas. Las formaciones guardadas no se alteran automáticamente.
          </p>
        </div>
        <div className="row-gap">
          <button className="btn btn-sm" onClick={() => handleNewBlank('formation')}>
            <Plus size={14} /> Nueva formación
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => handleNewBlank('play')}>
            <Plus size={14} /> Nueva jugada
          </button>
        </div>
      </div>

      {savedToast && <div className="alert alert-info">{savedToast}</div>}

      <div className="tactical-layout">
        {/* Panel izquierdo: Cancha y herramientas */}
        <div className="card stack">
          <div className="row-between">
            <div className="row-gap">
              <span className="badge badge-primary">
                {mode === 'formation' ? 'Editando Formación' : 'Editando Jugada'}
              </span>
              {linkedFormationName && mode === 'play' && (
                <span className="badge">Base: {linkedFormationName}</span>
              )}
            </div>
            <div className="row-gap">
              <button
                className={`btn btn-sm ${tool === 'select' ? 'btn-primary' : ''}`}
                onClick={() => setTool('select')}
              >
                <MousePointer size={14} /> Mover
              </button>
              {mode === 'play' && (
                <>
                  <button
                    className={`btn btn-sm ${tool === 'arrow' ? 'btn-primary' : ''}`}
                    onClick={() => setTool('arrow')}
                  >
                    <MoveRight size={14} /> Flecha
                  </button>
                  <button
                    className={`btn btn-sm ${tool === 'zone' ? 'btn-primary' : ''}`}
                    onClick={() => setTool('zone')}
                  >
                    <Square size={14} /> Zona
                  </button>
                </>
              )}
            </div>
          </div>

          {tool === 'arrow' && mode === 'play' && (
            <div className="row-gap alert">
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Tipo de movimiento:</span>
              {(['pass', 'move', 'attack', 'cover'] as MovementKind[]).map((k) => (
                <button
                  key={k}
                  className={`btn btn-sm ${movementKind === k ? 'btn-primary' : ''}`}
                  onClick={() => setMovementKind(k)}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: MOVEMENT_COLORS[k].stroke,
                      display: 'inline-block',
                    }}
                  />
                  {MOVEMENT_COLORS[k].label}
                </button>
              ))}
            </div>
          )}

          {tool === 'zone' && mode === 'play' && (
            <div className="row-gap alert">
              <input
                className="input"
                style={{ maxWidth: 200 }}
                placeholder="Etiqueta de zona"
                value={zoneLabel}
                onChange={(e) => setZoneLabel(e.target.value)}
              />
              <input
                type="color"
                value={zoneColor}
                onChange={(e) => setZoneColor(e.target.value)}
                title="Color de zona"
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Arrastrá sobre la cancha para marcar la zona.
              </span>
            </div>
          )}

          <TacticalCourt
            players={players}
            movements={mode === 'play' ? movements : []}
            zones={mode === 'play' ? zones : []}
            tool={tool}
            movementKind={movementKind}
            zoneLabel={zoneLabel}
            zoneColor={zoneColor}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
            onMovePlayer={handleMovePlayer}
            onAddMovement={handleAddMovement}
            onAddZone={handleAddZone}
            onRemoveMovement={(id) => setMovements((prev) => prev.filter((m) => m.id !== id))}
            onRemoveZone={(id) => setZones((prev) => prev.filter((z) => z.id !== id))}
          />

          {/* Barra para incorporar jugadores y editar seleccionado */}
          <div className="row-between">
            <div className="row-gap">
              <select
                className="select"
                style={{ width: 'auto', minWidth: 190 }}
                value=""
                onChange={(e) => {
                  if (e.target.value) handleAddRosterPlayer(e.target.value);
                }}
              >
                <option value="">+ Agregar jugador del plantel...</option>
                {teamPlayers
                  .filter((p) => p.active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number || '-'} {p.name}
                    </option>
                  ))}
              </select>
              <button className="btn btn-sm" onClick={handleAddGenericPlayer}>
                <UserPlus size={14} /> Ficha genérica
              </button>
            </div>

            {selectedPlayer && (
              <div className="row-gap">
                <input
                  className="input"
                  style={{ width: 95 }}
                  value={selectedPlayer.label}
                  onChange={(e) =>
                    setPlayers((prev) =>
                      prev.map((p) =>
                        p.id === selectedPlayer.id ? { ...p, label: e.target.value } : p
                      )
                    )
                  }
                  placeholder="Nombre"
                />
                <input
                  className="input"
                  style={{ width: 55 }}
                  value={selectedPlayer.number}
                  onChange={(e) =>
                    setPlayers((prev) =>
                      prev.map((p) =>
                        p.id === selectedPlayer.id ? { ...p, number: e.target.value } : p
                      )
                    )
                  }
                  placeholder="N°"
                />
                <input
                  type="color"
                  value={selectedPlayer.color}
                  onChange={(e) =>
                    setPlayers((prev) =>
                      prev.map((p) =>
                        p.id === selectedPlayer.id ? { ...p, color: e.target.value } : p
                      )
                    )
                  }
                />
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    setPlayers((prev) => prev.filter((p) => p.id !== selectedPlayer.id));
                    setSelectedPlayerId(null);
                  }}
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          {mode === 'play' && (movements.length > 0 || zones.length > 0) && (
            <div className="stack" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div className="row-between">
                <strong style={{ fontSize: '0.85rem' }}>
                  Secuencia de movimientos ({movements.length}) y zonas ({zones.length})
                </strong>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setMovements([]);
                    setZones([]);
                  }}
                >
                  Limpiar trazos
                </button>
              </div>
              <div className="row-gap">
                {movements.map((mv, i) => (
                  <span key={mv.id} className="badge">
                    {i + 1}. {MOVEMENT_COLORS[mv.kind].label}
                    <button
                      className="btn-ghost"
                      style={{ border: 'none', padding: '0 2px' }}
                      onClick={() => setMovements((prev) => prev.filter((x) => x.id !== mv.id))}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {zones.map((z) => (
                  <span key={z.id} className="badge badge-warning">
                    Zona: {z.label}
                    <button
                      className="btn-ghost"
                      style={{ border: 'none', padding: '0 2px' }}
                      onClick={() => setZones((prev) => prev.filter((x) => x.id !== z.id))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho: Metadatos y Bibliotecas */}
        <div className="stack">
          <div className="card stack">
            <h2 className="card-title">
              {mode === 'formation' ? 'Datos de la formación' : 'Datos de la jugada'}
            </h2>
            <div className="form-field">
              <label>Nombre *</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>{mode === 'formation' ? 'Categoría' : 'Objetivo táctico'}</label>
              <input
                className="input"
                placeholder={
                  mode === 'formation'
                    ? 'Ej. Recepción, Ataque, Defensa'
                    : 'Ej. Atacar zona libre detrás de red'
                }
                value={categoryOrObjective}
                onChange={(e) => setCategoryOrObjective(e.target.value)}
              />
            </div>
            {mode === 'formation' ? (
              <div className="form-field">
                <label>Etiquetas (separadas por coma)</label>
                <input
                  className="input"
                  placeholder="Base, 6v6, Saque"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  className="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}
            <div className="form-field">
              <label>Observaciones</label>
              <textarea
                className="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="row-gap">
              <button className="btn btn-primary" onClick={() => handleSaveCurrent(false)}>
                <Save size={15} /> Guardar
              </button>
              {(editingFormationId || editingPlayId) && (
                <button className="btn" onClick={() => handleSaveCurrent(true)}>
                  <Copy size={15} /> Guardar como copia
                </button>
              )}
            </div>
          </div>

          {/* Biblioteca de formaciones */}
          <div className="card stack">
            <div className="row-between">
              <h2 className="card-title row-gap">
                <Layers size={16} /> Formaciones ({teamFormations.length})
              </h2>
            </div>
            {teamFormations.length === 0 ? (
              <div className="empty-state">No hay formaciones guardadas.</div>
            ) : (
              <div className="stack">
                {teamFormations.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '0.6rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div className="row-between">
                      <strong>{f.name}</strong>
                      <span className="badge">{f.players.length} jug.</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {f.category} {f.tags.length > 0 ? `· ${f.tags.join(', ')}` : ''}
                    </div>
                    <div className="row-gap" style={{ marginTop: '0.5rem' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => loadFormationIntoEditor(f, 'play')}
                      >
                        Usar en jugada
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => loadFormationIntoEditor(f, 'formation')}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => duplicateFormation(f.id)}
                        title="Duplicar formación"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => deleteFormation(f.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Biblioteca de jugadas */}
          <div className="card stack">
            <h2 className="card-title">Biblioteca de jugadas ({teamPlays.length})</h2>
            {teamPlays.length === 0 ? (
              <div className="empty-state">Todavía no guardaste jugadas tácticas.</div>
            ) : (
              <div className="stack">
                {teamPlays.map((pl) => (
                  <div
                    key={pl.id}
                    style={{
                      padding: '0.6rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div className="row-between">
                      <strong>{pl.name}</strong>
                      <span className="badge badge-primary">{pl.movements.length} mov.</span>
                    </div>
                    {pl.tacticalObjective && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Obj: {pl.tacticalObjective}
                      </div>
                    )}
                    <div className="row-gap" style={{ marginTop: '0.5rem' }}>
                      <button className="btn btn-sm" onClick={() => loadPlayIntoEditor(pl)}>
                        Abrir en cancha
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => deletePlay(pl.id)}
                        title="Eliminar jugada"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
