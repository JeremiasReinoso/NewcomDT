import React, { useRef, useState } from 'react';
import type {
  CourtPoint,
  FormationPlayer,
  MovementKind,
  TacticalMovement,
  TacticalZone,
} from '../domain/types';

export type CourtTool = 'select' | 'arrow' | 'zone';

interface TacticalCourtProps {
  players: FormationPlayer[];
  movements: TacticalMovement[];
  zones: TacticalZone[];
  tool: CourtTool;
  movementKind: MovementKind;
  zoneLabel: string;
  zoneColor: string;
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
  onMovePlayer: (id: string, x: number, y: number) => void;
  onAddMovement: (from: CourtPoint, to: CourtPoint) => void;
  onAddZone: (zone: Omit<TacticalZone, 'id'>) => void;
  onRemoveMovement?: (id: string) => void;
  onRemoveZone?: (id: string) => void;
}

const MOVEMENT_COLORS: Record<MovementKind, { stroke: string; dash?: string; label: string }> = {
  pass: { stroke: '#38bdf8', label: 'Pase' },
  move: { stroke: '#facc15', dash: '2.5 2', label: 'Desplazamiento' },
  attack: { stroke: '#f97316', label: 'Lanzamiento / Ataque' },
  cover: { stroke: '#34d399', dash: '1.5 1.5', label: 'Cobertura' },
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const TacticalCourt: React.FC<TacticalCourtProps> = ({
  players,
  movements,
  zones,
  tool,
  movementKind,
  zoneLabel,
  zoneColor,
  selectedPlayerId,
  onSelectPlayer,
  onMovePlayer,
  onAddMovement,
  onAddZone,
  onRemoveMovement,
  onRemoveZone,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const [drawStart, setDrawStart] = useState<CourtPoint | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<CourtPoint | null>(null);

  const toCourtCoords = (clientX: number, clientY: number): CourtPoint => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 50 };
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.round(clamp(x, 2, 98) * 10) / 10,
      y: Math.round(clamp(y, 2, 98) * 10) / 10,
    };
  };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'select') {
      onSelectPlayer(null);
      return;
    }
    const pt = toCourtCoords(e.clientX, e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrawStart(pt);
    setDrawCurrent(pt);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = toCourtCoords(e.clientX, e.clientY);
    if (draggingPlayerId) {
      onMovePlayer(draggingPlayerId, pt.x, pt.y);
      return;
    }
    if (drawStart) {
      setDrawCurrent(pt);
    }
  };

  const handleSvgPointerUp = () => {
    if (draggingPlayerId) {
      setDraggingPlayerId(null);
      return;
    }
    if (drawStart && drawCurrent) {
      const dx = drawCurrent.x - drawStart.x;
      const dy = drawCurrent.y - drawStart.y;
      const dist = Math.hypot(dx, dy);
      if (tool === 'arrow' && dist >= 4) {
        onAddMovement(drawStart, drawCurrent);
      } else if (tool === 'zone' && Math.abs(dx) >= 4 && Math.abs(dy) >= 4) {
        onAddZone({
          x: Math.min(drawStart.x, drawCurrent.x),
          y: Math.min(drawStart.y, drawCurrent.y),
          width: Math.abs(dx),
          height: Math.abs(dy),
          label: zoneLabel.trim() || 'Zona de interés',
          color: zoneColor,
        });
      }
    }
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const handlePlayerPointerDown = (e: React.PointerEvent, id: string) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    onSelectPlayer(id);
    setDraggingPlayerId(id);
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  return (
    <div className="court-container">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="court-svg"
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerCancel={handleSvgPointerUp}
      >
        <defs>
          {(['pass', 'move', 'attack', 'cover'] as MovementKind[]).map((kind) => (
            <marker
              key={kind}
              id={`arrow-${kind}`}
              markerWidth="5"
              markerHeight="5"
              refX="3.8"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0, 5 2.5, 0 5" fill={MOVEMENT_COLORS[kind].stroke} />
            </marker>
          ))}
        </defs>

        {/* Fondo exterior */}
        <rect x="0" y="0" width="100" height="100" fill="#1e293b" />

        {/* Zona rival (superior) */}
        <rect
          x="8"
          y="4"
          width="84"
          height="18"
          fill="#1e3a5f"
          stroke="#94a3b8"
          strokeWidth="0.6"
        />
        <text x="50" y="13.5" textAnchor="middle" fill="#94a3b8" fontSize="3.2" fontWeight="600">
          CAMPO RIVAL
        </text>

        {/* Campo propio */}
        <rect
          x="8"
          y="22"
          width="84"
          height="72"
          fill="#0d4a6b"
          stroke="#f8fafc"
          strokeWidth="0.8"
        />

        {/* Red */}
        <line x1="6" y1="22" x2="94" y2="22" stroke="#f59e0b" strokeWidth="1.4" />
        <text x="93" y="20.2" textAnchor="end" fill="#fbbf24" fontSize="2.7" fontWeight="700">
          RED
        </text>

        {/* Línea de ataque (3 metros aprox) */}
        <line
          x1="8"
          y1="46"
          x2="92"
          y2="46"
          stroke="#e2e8f0"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
        />

        {/* Guías sutiles de zonas 1-6 */}
        <line x1="36" y1="22" x2="36" y2="94" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        <line x1="64" y1="22" x2="64" y2="94" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        <text x="22" y="91" textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="2.8">
          Z5
        </text>
        <text x="50" y="91" textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="2.8">
          Z6
        </text>
        <text x="78" y="91" textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="2.8">
          Z1
        </text>
        <text x="22" y="34" textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="2.8">
          Z4
        </text>
        <text x="50" y="34" textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="2.8">
          Z3
        </text>
        <text x="78" y="34" textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="2.8">
          Z2
        </text>

        {/* Zonas de interés guardadas */}
        {zones.map((z) => (
          <g
            key={z.id}
            onClick={(e) => {
              if (tool === 'select' && onRemoveZone && e.shiftKey) {
                onRemoveZone(z.id);
              }
            }}
          >
            <rect
              x={z.x}
              y={z.y}
              width={z.width}
              height={z.height}
              fill={z.color}
              fillOpacity="0.22"
              stroke={z.color}
              strokeWidth="0.6"
              strokeDasharray="2 1"
              rx="1.2"
            />
            <text
              x={z.x + z.width / 2}
              y={z.y + z.height / 2 + 1}
              textAnchor="middle"
              fill="#fff"
              fontSize="2.7"
              fontWeight="600"
            >
              {z.label}
            </text>
          </g>
        ))}

        {/* Vista previa de zona */}
        {tool === 'zone' && drawStart && drawCurrent && (
          <rect
            x={Math.min(drawStart.x, drawCurrent.x)}
            y={Math.min(drawStart.y, drawCurrent.y)}
            width={Math.abs(drawCurrent.x - drawStart.x)}
            height={Math.abs(drawCurrent.y - drawStart.y)}
            fill={zoneColor}
            fillOpacity="0.2"
            stroke={zoneColor}
            strokeWidth="0.6"
            strokeDasharray="2 1"
          />
        )}

        {/* Movimientos / Flechas */}
        {movements.map((mv) => {
          const style = MOVEMENT_COLORS[mv.kind];
          const midX = (mv.from.x + mv.to.x) / 2;
          const midY = (mv.from.y + mv.to.y) / 2;
          return (
            <g
              key={mv.id}
              onClick={(e) => {
                if (tool === 'select' && onRemoveMovement && e.shiftKey) {
                  onRemoveMovement(mv.id);
                }
              }}
            >
              <line
                x1={mv.from.x}
                y1={mv.from.y}
                x2={mv.to.x}
                y2={mv.to.y}
                stroke={style.stroke}
                strokeWidth="1"
                strokeDasharray={style.dash}
                markerEnd={`url(#arrow-${mv.kind})`}
              />
              {mv.label && (
                <text
                  x={midX}
                  y={midY - 1.5}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="2.5"
                  fontWeight="600"
                >
                  {mv.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Vista previa de flecha */}
        {tool === 'arrow' && drawStart && drawCurrent && (
          <line
            x1={drawStart.x}
            y1={drawStart.y}
            x2={drawCurrent.x}
            y2={drawCurrent.y}
            stroke={MOVEMENT_COLORS[movementKind].stroke}
            strokeWidth="1"
            strokeDasharray={MOVEMENT_COLORS[movementKind].dash}
            markerEnd={`url(#arrow-${movementKind})`}
          />
        )}

        {/* Jugadores */}
        {players.map((p) => {
          const isSelected = p.id === selectedPlayerId;
          return (
            <g
              key={p.id}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ cursor: tool === 'select' ? 'grab' : 'crosshair' }}
              onPointerDown={(e) => handlePlayerPointerDown(e, p.id)}
            >
              {isSelected && (
                <circle r="5.3" fill="none" stroke="#fbbf24" strokeWidth="0.7" />
              )}
              <circle
                r="4"
                fill={p.color || '#0284c7'}
                stroke="#ffffff"
                strokeWidth="0.65"
              />
              <text
                y="1.2"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="3.1"
                fontWeight="700"
              >
                {p.number || '•'}
              </text>
              <text
                y="7.1"
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="2.7"
                fontWeight="600"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export { MOVEMENT_COLORS };
