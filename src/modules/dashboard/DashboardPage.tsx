import React from 'react';
import {
  Activity,
  BarChart3,
  Calendar,
  ClipboardCheck,
  LayoutGrid,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import type { NavSection } from '../../domain/types';
import { useCoach } from '../../state/CoachContext';

interface DashboardPageProps {
  onNavigate: (section: NavSection) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    activeTeam,
    teamPlayers,
    teamFormations,
    teamPlays,
    teamSessions,
    teamMatches,
    teamObjectives,
  } = useCoach();

  const plannedSessions = teamSessions.filter((s) => s.status === 'planificada');
  const completedSessions = teamSessions.filter((s) => s.status === 'realizada');
  const pendingObjectives = teamObjectives.filter((o) => o.status !== 'logrado');
  const recentMatches = teamMatches.slice(0, 3);
  const latestObservations = teamMatches
    .flatMap((m) =>
      m.observations.map((text, idx) => ({
        id: `${m.id}_${idx}`,
        matchLabel: `vs ${m.rivalName} (${m.date})`,
        text,
      }))
    )
    .slice(0, 4);

  if (!activeTeam) {
    return (
      <div className="stack">
        <div className="page-header">
          <div>
            <h1>Bienvenido a Newcom DT</h1>
            <p>Creá tu primer equipo para comenzar a planificar estrategias, entrenamientos y partidos.</p>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('teams')}>
            <Users size={16} /> Crear primer equipo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>{activeTeam.name}</h1>
          <p>
            Categoría: <strong>{activeTeam.category}</strong> · Temporada {activeTeam.season} · DT:{' '}
            {activeTeam.coachName || 'Sin asignar'}
          </p>
        </div>
        <div className="row-gap">
          <button className="btn btn-sm" onClick={() => onNavigate('teams')}>
            <Users size={15} /> Gestionar plantel
          </button>
        </div>
      </div>

      {/* Accesos rápidos a los 4 módulos */}
      <div className="grid-4">
        <div className="card kpi-card">
          <span className="kpi-label">Estrategias</span>
          <span className="kpi-value">{teamFormations.length + teamPlays.length}</span>
          <span className="kpi-sub">
            {teamFormations.length} formaciones · {teamPlays.length} jugadas
          </span>
          <button
            className="btn btn-sm btn-primary"
            style={{ marginTop: '0.4rem' }}
            onClick={() => onNavigate('strategies')}
          >
            <LayoutGrid size={14} /> Abrir Cancha Táctica
          </button>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">Entrenamientos</span>
          <span className="kpi-value">{plannedSessions.length}</span>
          <span className="kpi-sub">
            Planificados · {completedSessions.length} realizados
          </span>
          <button
            className="btn btn-sm"
            style={{ marginTop: '0.4rem' }}
            onClick={() => onNavigate('trainings')}
          >
            <Calendar size={14} /> Ir a Entrenamientos
          </button>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">Plantel y Estadísticas</span>
          <span className="kpi-value">{teamPlayers.filter((p) => p.active).length}</span>
          <span className="kpi-sub">Jugadores activos registrados</span>
          <button
            className="btn btn-sm"
            style={{ marginTop: '0.4rem' }}
            onClick={() => onNavigate('stats')}
          >
            <BarChart3 size={14} /> Ver Estadísticas
          </button>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">Análisis de Partidos</span>
          <span className="kpi-value">{teamMatches.length}</span>
          <span className="kpi-sub">Encuentros documentados</span>
          <button
            className="btn btn-sm"
            style={{ marginTop: '0.4rem' }}
            onClick={() => onNavigate('matches')}
          >
            <Trophy size={14} /> Analizar Partidos
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Próximos entrenamientos */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title row-gap">
              <ClipboardCheck size={17} /> Próximos entrenamientos
            </h2>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('trainings')}>
              Ver todos
            </button>
          </div>
          {plannedSessions.length === 0 ? (
            <div className="empty-state">No hay sesiones planificadas pendientes.</div>
          ) : (
            <div className="stack">
              {plannedSessions.slice(0, 4).map((s) => (
                <div key={s.id} className="row-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <strong>{s.name}</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {s.date} · {s.plannedMinutes} min · Objetivo: {s.objectiveText || 'General'}
                    </div>
                  </div>
                  <span className="badge badge-primary">Planificada</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Objetivos deportivos pendientes */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title row-gap">
              <Target size={17} /> Objetivos deportivos pendientes
            </h2>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('trainings')}>
              Planificar
            </button>
          </div>
          {pendingObjectives.length === 0 ? (
            <div className="empty-state">
              No hay objetivos pendientes. Podés crear uno desde un análisis de partido.
            </div>
          ) : (
            <div className="stack">
              {pendingObjectives.slice(0, 4).map((obj) => (
                <div key={obj.id} style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div className="row-between">
                    <strong>{obj.title}</strong>
                    <span
                      className={`badge ${
                        obj.status === 'en_progreso' ? 'badge-warning' : 'badge-primary'
                      }`}
                    >
                      {obj.status === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                    </span>
                  </div>
                  {obj.sourceLabel && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)' }}>
                      Origen: {obj.sourceLabel}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos partidos */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title row-gap">
              <Trophy size={17} /> Últimos partidos registrados
            </h2>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('matches')}>
              Ver historial
            </button>
          </div>
          {recentMatches.length === 0 ? (
            <div className="empty-state">Todavía no registraste partidos.</div>
          ) : (
            <div className="stack">
              {recentMatches.map((m) => (
                <div key={m.id} className="row-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <strong>vs {m.rivalName}</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {m.date} · {m.scoreSummary || 'Sin marcador'}
                    </div>
                  </div>
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
                      : m.result === 'perdido'}
                        ? 'Perdido'
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas observaciones */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title row-gap">
              <Activity size={17} /> Últimas observaciones
            </h2>
          </div>
          {latestObservations.length === 0 ? (
            <div className="empty-state">Sin observaciones registradas en partidos.</div>
          ) : (
            <div className="stack">
              {latestObservations.map((obs) => (
                <div key={obs.id} style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', fontWeight: 600 }}>
                    {obs.matchLabel}
                  </div>
                  <div style={{ fontSize: '0.88rem' }}>{obs.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
