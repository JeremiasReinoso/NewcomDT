import React, { useRef, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Home,
  LayoutGrid,
  Menu,
  RotateCcw,
  Trophy,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type { NavSection } from './domain/types';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { MatchesPage } from './modules/matches/MatchesPage';
import { StatsPage } from './modules/stats/StatsPage';
import { StrategiesPage } from './modules/strategies/StrategiesPage';
import { TeamsPage } from './modules/teams/TeamsPage';
import { TrainingsPage } from './modules/trainings/TrainingsPage';
import { CoachProvider, useCoach } from './state/CoachContext';

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Inicio', icon: <Home size={18} /> },
  { id: 'teams', label: 'Equipos y Plantel', icon: <Users size={18} /> },
  { id: 'strategies', label: 'Estrategias', icon: <LayoutGrid size={18} /> },
  { id: 'trainings', label: 'Entrenamientos', icon: <Calendar size={18} /> },
  { id: 'stats', label: 'Estadísticas', icon: <BarChart3 size={18} /> },
  { id: 'matches', label: 'Análisis de Partidos', icon: <Trophy size={18} /> },
];

const AppShell: React.FC = () => {
  const { db, activeTeam, setActiveTeam, exportBackup, importBackup, loadDemoData, clearAllData } =
    useCoach();
  const [section, setSection] = useState<NavSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleNavigate = (next: NavSection) => {
    setSection(next);
    setSidebarOpen(false);
  };

  const handleDownloadBackup = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newcom-DT-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importBackup(text);
      window.alert('Respaldo importado correctamente.');
    } catch {
      window.alert('El archivo seleccionado no es un respaldo válido de N3com Coach.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <img src="./icon.svg" alt="Newcom DT" className="brand-logo" />
          <div style={{ flex: 1 }}>
            <div className="brand-title">Newcom DT</div>
            <div className="brand-subtitle">Dirección Técnica Newcom</div>
          </div>
          <button
            className="btn btn-sm btn-dark"
            style={{ display: sidebarOpen ? 'inline-flex' : 'none' }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={16} />
          </button>
        </div>

        <div className="team-switcher">
          <label htmlFor="team-select">Equipo activo</label>
          <select
            id="team-select"
            value={activeTeam?.id ?? ''}
            onChange={(e) => setActiveTeam(e.target.value)}
          >
            {db.teams.length === 0 && <option value="">Sin equipos</option>}
            {db.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
        </div>

        <nav className="nav-list" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${section === item.id ? 'active' : ''}`}
              onClick={() => handleNavigate(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-sm btn-dark" onClick={handleDownloadBackup}>
            <Download size={14} /> Exportar respaldo (.json)
          </button>
          <button
            className="btn btn-sm btn-dark"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} /> Importar respaldo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleUploadBackup}
          />
          <div className="row-gap">
            <button
              className="btn btn-sm btn-dark"
              style={{ flex: 1 }}
              onClick={() => {
                if (window.confirm('¿Cargar los datos de ejemplo? Reemplazará el estado actual.')) {
                  loadDemoData();
                }
              }}
              title="Cargar equipo de demostración"
            >
              <RotateCcw size={13} /> Demo
            </button>
            <button
              className="btn btn-sm btn-dark"
              style={{ flex: 1 }}
              onClick={() => {
                if (window.confirm('¿Vaciar todos los datos guardados en localStorage?')) {
                  clearAllData();
                }
              }}
              title="Limpiar base local"
            >
              Limpiar
            </button>
          </div>
          <div className="sidebar-footer-note">
            Guardado automático local (localStorage). 100% compatible con GitHub Pages.
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="mobile-topbar">
          <div className="row-gap">
            <img src="./icon.svg" alt="Newcom DT" style={{ width: 28, height: 28 }} />
            <strong>Newcom DT</strong>
          </div>
          <button
            className="btn btn-sm btn-dark"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>
        </header>

        <main className="page-content">
          {section === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {section === 'teams' && <TeamsPage />}
          {section === 'strategies' && <StrategiesPage />}
          {section === 'trainings' && <TrainingsPage />}
          {section === 'stats' && <StatsPage />}
          {section === 'matches' && <MatchesPage />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <CoachProvider>
    <AppShell />
  </CoachProvider>
);

export default App;
