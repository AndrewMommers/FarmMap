import type { Paddock } from '../../types';

// Polygon shapes for each paddock (normalised 0-1 coords, rendered in an 800×600 SVG)
const PADDOCK_SHAPES: Record<string, [number, number][]> = {
  'p-1': [[0.05,0.05],[0.38,0.05],[0.38,0.28],[0.05,0.28]],
  'p-2': [[0.40,0.05],[0.62,0.05],[0.62,0.28],[0.40,0.28]],
  'p-3': [[0.64,0.05],[0.95,0.05],[0.95,0.35],[0.64,0.35]],
  'p-4': [[0.05,0.32],[0.25,0.32],[0.25,0.55],[0.05,0.55]],
  'p-5': [[0.27,0.32],[0.62,0.32],[0.62,0.55],[0.27,0.55]],
  'p-6': [[0.64,0.38],[0.95,0.38],[0.95,0.70],[0.64,0.70]],
  'p-7': [[0.05,0.58],[0.38,0.58],[0.38,0.75],[0.05,0.75]],
  'p-8': [[0.40,0.58],[0.62,0.58],[0.62,0.75],[0.40,0.75]],
};

const STATUS_FILL: Record<string, string> = {
  active:    '#bbf7d0',
  fallow:    '#fef9c3',
  harvested: '#e9d5ff',
  locked:    '#e5e7eb',
};
const STATUS_STROKE: Record<string, string> = {
  active:    '#16a34a',
  fallow:    '#ca8a04',
  harvested: '#7c3aed',
  locked:    '#6b7280',
};

interface Props {
  paddocks: Paddock[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function FarmMapSVG({ paddocks, selectedId, onSelect }: Props) {
  const W = 800;
  const H = 600;

  const toPoints = (coords: [number, number][]) =>
    coords.map(([x, y]) => `${x * W},${y * H}`).join(' ');

  const centroid = (coords: [number, number][]): [number, number] => {
    const cx = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const cy = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return [cx * W, cy * H];
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Background – paddock map background */}
      <rect width={W} height={H} fill="#f0fdf4" rx="12" />

      {/* Water feature */}
      <ellipse cx={480} cy={290} rx={30} ry={18} fill="#bae6fd" stroke="#7dd3fc" strokeWidth={1.5} />
      <text x={480} y={295} textAnchor="middle" fontSize={9} fill="#0369a1">Dam</text>

      {/* Homestead */}
      <rect x={310} y={275} width={24} height={18} fill="#fef3c7" stroke="#d97706" strokeWidth={1.5} rx={2} />
      <text x={322} y={308} textAnchor="middle" fontSize={9} fill="#78350f">Homestead</text>

      {/* Roads */}
      <line x1={0} y1={300} x2={W} y2={300} stroke="#d1d5db" strokeWidth={4} strokeDasharray="10 6" />
      <line x1={400} y1={0} x2={400} y2={H} stroke="#d1d5db" strokeWidth={3} strokeDasharray="8 5" />

      {/* Paddocks */}
      {paddocks.map((p) => {
        const shape = PADDOCK_SHAPES[p.id];
        if (!shape) return null;
        const fill = STATUS_FILL[p.status] ?? '#f3f4f6';
        const stroke = STATUS_STROKE[p.status] ?? '#9ca3af';
        const isSelected = p.id === selectedId;
        const [cx, cy] = centroid(shape);

        return (
          <g key={p.id} onClick={() => onSelect?.(p.id)} style={{ cursor: 'pointer' }}>
            <polygon
              points={toPoints(shape)}
              fill={fill}
              stroke={isSelected ? '#1e3a8a' : stroke}
              strokeWidth={isSelected ? 3 : 1.5}
              opacity={0.85}
              className="transition-all"
            />
            {isSelected && (
              <polygon
                points={toPoints(shape)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="6 3"
                opacity={0.8}
              />
            )}
            {/* Paddock label */}
            <text
              x={cx} y={cy - 6}
              textAnchor="middle"
              fontSize={11}
              fontWeight="600"
              fill="#1f2937"
            >{p.name}</text>
            <text
              x={cx} y={cy + 8}
              textAnchor="middle"
              fontSize={10}
              fill="#4b5563"
            >{p.hectares} ha</text>
            {p.currentCrop && (
              <text
                x={cx} y={cy + 20}
                textAnchor="middle"
                fontSize={9}
                fill={STATUS_STROKE[p.status] ?? '#6b7280'}
              >{p.currentCrop}</text>
            )}
          </g>
        );
      })}

      {/* Compass */}
      <g transform={`translate(${W - 44}, 44)`}>
        <circle r={20} fill="white" stroke="#d1d5db" strokeWidth={1} fillOpacity={0.9} />
        <text textAnchor="middle" y={-7} fontSize={10} fontWeight="700" fill="#1f2937">N</text>
        <line x1={0} y1={-14} x2={0} y2={14} stroke="#374151" strokeWidth={1.5} />
        <line x1={-14} y1={0} x2={14} y2={0} stroke="#374151" strokeWidth={1} strokeDasharray="3 2" />
        <polygon points="0,-14 -4,-2 0,0 4,-2" fill="#1f2937" />
      </g>

      {/* Legend */}
      <g transform="translate(10, 510)">
        {Object.entries(STATUS_FILL).map(([status, fill], i) => (
          <g key={status} transform={`translate(${i * 110}, 0)`}>
            <rect width={14} height={14} fill={fill} stroke={STATUS_STROKE[status]} strokeWidth={1.5} rx={3} />
            <text x={18} y={11} fontSize={11} fill="#374151" >{status.charAt(0).toUpperCase() + status.slice(1)}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
