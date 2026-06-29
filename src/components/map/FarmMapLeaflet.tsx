import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer, TileLayer, Polygon, Popup,
  useMapEvents, Polyline, CircleMarker, Marker,
} from 'react-leaflet';
import L from 'leaflet';
import type { Paddock, FenceLine, MapFeature, MapFeatureType } from '../../types';

// Fix Leaflet's default icon paths broken by bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DrawnPaddock {
  polygon: [number, number][];
  centroid: [number, number];
  hectares: number;
  color?: string;
}

export interface DrawnFence {
  points: [number, number][];
  color: string;
}

interface Props {
  paddocks: Paddock[];
  fenceLines?: FenceLine[];
  mapFeatures?: MapFeature[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** When provided, enable polygon-drawing mode and call this with the result. */
  onDrawComplete?: (drawn: DrawnPaddock) => void;
  onFenceComplete?: (fence: DrawnFence) => void;
  onFeaturePlace?: (type: MapFeatureType, coords: [number, number]) => void;
  /** Active drawing tool from parent. 'paddock' uses onDrawComplete. */
  drawTool?: 'paddock' | 'fence' | MapFeatureType | null;
  /** Initial centre – if undefined the map geocodes `address` */
  center?: [number, number];
  address?: string;
}

// ─── Status colours ───────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  active:    '#16a34a',
  fallow:    '#ca8a04',
  harvested: '#7c3aed',
  locked:    '#6b7280',
};

// ─── Draw colour palette ──────────────────────────────────────────────────────

export const DRAW_COLORS = [
  '#16a34a', '#ca8a04', '#1d4ed8', '#7c3aed',
  '#dc2626', '#ea580c', '#0d9488', '#db2777',
];

function makeDragIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.5);cursor:grab;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function makeLabelIcon(name: string, crop?: string, ha?: number) {
  const sh = '0 0 4px #000,0 0 8px #000,1px 1px 2px #000';
  const lines = [
    `<div style="font-weight:700;font-size:12px;letter-spacing:0.4px;text-shadow:${sh};">${name}</div>`,
    crop ? `<div style="font-size:10px;opacity:0.9;text-shadow:${sh};">${crop}</div>` : '',
    `<div style="font-size:10px;opacity:0.65;text-shadow:${sh};">${ha} ha</div>`,
  ].filter(Boolean).join('');
  return L.divIcon({
    className: '',
    html: `<div style="color:#fff;text-align:center;white-space:nowrap;line-height:1.5;pointer-events:none;transform:translate(-50%,-50%)">${lines}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// ─── Map feature icons ────────────────────────────────────────────────────────

const FEATURE_META: Record<MapFeatureType, { bg: string; emoji: string; label: string }> = {
  shed:         { bg: '#78350f', emoji: '🏗', label: 'Shed' },
  water_trough: { bg: '#0369a1', emoji: '💧', label: 'Water Trough' },
  dam:          { bg: '#1e3a5f', emoji: '🌊', label: 'Dam' },
  gate:         { bg: '#374151', emoji: '🔒', label: 'Gate' },
};

function makeFeatureIcon(type: MapFeatureType, name: string) {
  const { bg, emoji } = FEATURE_META[type];
  return L.divIcon({
    className: '',
    html: `<div style="transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:3px;background:${bg};color:white;border-radius:8px;padding:3px 8px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.6);border:1.5px solid rgba(255,255,255,.35);white-space:nowrap;pointer-events:none;">${emoji} ${name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// ─── Geocoding (Nominatim) ────────────────────────────────────────────────────

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=au`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'FarmMap/1.0' },
    });
    const data = await res.json();
    if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {
    // ignore
  }
  return null;
}

// ─── Hectare estimate from polygon ───────────────────────────────────────────

function polygonHectares(pts: [number, number][]): number {
  if (pts.length < 3) return 0;
  // Shoelace formula on lat/lng, then convert deg² → m²
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [lat1, lng1] = pts[i];
    const [lat2, lng2] = pts[(i + 1) % pts.length];
    area += lat1 * lng2 - lat2 * lng1;
  }
  const degSqr = Math.abs(area) / 2;
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((pts[0][0] * Math.PI) / 180);
  const m2 = degSqr * metersPerDegLat * metersPerDegLng;
  return Math.round((m2 / 10000) * 10) / 10; // ha, 1dp
}

function centroidOf(pts: [number, number][]): [number, number] {
  const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [lat, lng];
}

// ─── Drawing layer ────────────────────────────────────────────────────────────

interface DrawLayerProps {
  points: [number, number][];
  color: string;
  onAddPoint: (pt: [number, number]) => void;
  onMovePoint: (index: number, pt: [number, number]) => void;
  onClose: () => void;
}

function DrawLayer({ points, color, onAddPoint, onMovePoint, onClose }: DrawLayerProps) {
  useMapEvents({
    click(e) {
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
    dblclick(e) {
      e.originalEvent.preventDefault();
      onClose();
    },
  });

  const icon = makeDragIcon(color);

  return (
    <>
      {/* Preview polygon fill once ≥ 3 points */}
      {points.length >= 3 && (
        <Polygon
          positions={points}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 2, dashArray: '6 4' }}
        />
      )}
      {/* Preview line for 2 points */}
      {points.length === 2 && (
        <Polyline positions={points} pathOptions={{ color, dashArray: '6 4', weight: 2 }} />
      )}
      {/* Closing edge preview */}
      {points.length >= 3 && (
        <Polyline
          positions={[points[points.length - 1], points[0]]}
          pathOptions={{ color, dashArray: '4 4', weight: 1.5, opacity: 0.6 }}
        />
      )}
      {/* Draggable vertex markers */}
      {points.map((pt, i) => (
        <Marker
          key={`draw-${i}-${color}`}
          position={pt}
          icon={icon}
          draggable={true}
          eventHandlers={{
            dragend(e) {
              const ll = (e.target as L.Marker).getLatLng();
              onMovePoint(i, [ll.lat, ll.lng]);
            },
          }}
        />
      ))}
    </>
  );
}

// ─── Fence-line drawing layer ─────────────────────────────────────────────────

interface FenceLayerProps {
  points: [number, number][];
  color: string;
  onAddPoint: (pt: [number, number]) => void;
  onMovePoint: (index: number, pt: [number, number]) => void;
  onFinish: () => void;
}

function FenceLayer({ points, color, onAddPoint, onMovePoint, onFinish }: FenceLayerProps) {
  useMapEvents({
    click(e) { onAddPoint([e.latlng.lat, e.latlng.lng]); },
    dblclick(e) { e.originalEvent.preventDefault(); onFinish(); },
  });
  const icon = makeDragIcon(color);
  return (
    <>
      {points.length >= 2 && (
        <Polyline positions={points} pathOptions={{ color, weight: 3 }} />
      )}
      {points.map((pt, i) => (
        <Marker
          key={`fence-${i}`}
          position={pt}
          icon={icon}
          draggable
          eventHandlers={{
            dragend(e) {
              const ll = (e.target as L.Marker).getLatLng();
              onMovePoint(i, [ll.lat, ll.lng]);
            },
          }}
        />
      ))}
    </>
  );
}

// ─── Feature placement layer ──────────────────────────────────────────────────

function FeaturePlaceLayer({ onPlace }: { onPlace: (pt: [number, number]) => void }) {
  useMapEvents({ click(e) { onPlace([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

// ─── Auto-centre helper ───────────────────────────────────────────────────────

function MapCentreUpdater({ centre }: { centre: [number, number] }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView(centre, map.getZoom());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centre[0], centre[1]]);
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FarmMapLeaflet({
  paddocks,
  fenceLines = [],
  mapFeatures = [],
  selectedId,
  onSelect,
  onDrawComplete,
  onFenceComplete,
  onFeaturePlace,
  drawTool: drawToolProp,
  center: propCenter,
  address,
}: Props) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    propCenter ?? [-27.5, 133.5] // Australia default
  );
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [fencePoints, setFencePoints] = useState<[number, number][]>([]);
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);
  const mapRef = useRef<L.Map | null>(null);

  // Resolve active tool: explicit prop wins; fallback to 'paddock' if onDrawComplete is provided
  const activeTool = drawToolProp !== undefined
    ? drawToolProp
    : (onDrawComplete ? 'paddock' : null);

  const isDrawingPaddock = activeTool === 'paddock';
  const isDrawingFence   = activeTool === 'fence';
  const placingType: MapFeatureType | null =
    activeTool === 'shed' || activeTool === 'water_trough' ||
    activeTool === 'dam'  || activeTool === 'gate'
      ? activeTool as MapFeatureType
      : null;
  const isAnyTool = isDrawingPaddock || isDrawingFence || !!placingType;

  // ── Geocode address ───────────────────────────────────────────────────────
  useEffect(() => {
    if (propCenter) { setMapCenter(propCenter); return; }
    if (!address) return;
    geocodeAddress(address).then((coords) => {
      if (coords) setMapCenter(coords);
    });
  }, [address, propCenter]);

  // ── Close polygon ─────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (drawPoints.length < 3 || !onDrawComplete) return;
    const polygon = [...drawPoints];
    onDrawComplete({
      polygon,
      centroid: centroidOf(polygon),
      hectares: polygonHectares(polygon),
      color: drawColor,
    });
    setDrawPoints([]);
  }, [drawPoints, onDrawComplete, drawColor]);

  const handleAddPoint = useCallback((pt: [number, number]) => {
    setDrawPoints((prev) => [...prev, pt]);
  }, []);

  const handleMovePoint = useCallback((index: number, pt: [number, number]) => {
    setDrawPoints((prev) => prev.map((p, i) => i === index ? pt : p));
  }, []);

  const handleUndo = () => setDrawPoints((prev) => prev.slice(0, -1));
  const handleReset = () => setDrawPoints([]);

  // ── Finish fence line ─────────────────────────────────────────────────────
  const handleFenceFinish = useCallback(() => {
    if (fencePoints.length < 2 || !onFenceComplete) return;
    onFenceComplete({ points: [...fencePoints], color: drawColor });
    setFencePoints([]);
  }, [fencePoints, onFenceComplete, drawColor]);

  const handleFenceAddPoint = useCallback((pt: [number, number]) => {
    setFencePoints((prev) => [...prev, pt]);
  }, []);

  const handleFenceMovePoint = useCallback((index: number, pt: [number, number]) => {
    setFencePoints((prev) => prev.map((p, i) => i === index ? pt : p));
  }, []);

  const handleFenceUndo = () => setFencePoints((prev) => prev.slice(0, -1));
  const handleFenceReset = () => setFencePoints([]);

  // ── Place feature ─────────────────────────────────────────────────────────
  const handleFeaturePlace = useCallback((pt: [number, number]) => {
    if (!placingType || !onFeaturePlace) return;
    onFeaturePlace(placingType, pt);
  }, [placingType, onFeaturePlace]);

  // ── Derived zoom: if we have polygon paddocks, fit them ───────────────────
  const initialZoom = paddocks.some((p) => p.polygon) ? 14 : 13;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        doubleClickZoom={!isAnyTool}
      >
        {/* ESRI World Imagery — free satellite tiles, no API key */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          maxNativeZoom={19}
          maxZoom={21}
        />
        {/* Labels overlay on top of satellite */}
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          opacity={0.6}
          maxNativeZoom={19}
          maxZoom={21}
        />

        {/* Auto-recentre when geocoding resolves */}
        <MapCentreUpdater centre={mapCenter} />

        {/* Existing paddock polygons */}
        {paddocks.map((p) => {
          if (!p.polygon || p.polygon.length < 3) {
            if (!p.coordinates) return null;
            return (
              <CircleMarker
                key={p.id}
                center={p.coordinates}
                radius={8}
                pathOptions={{
                  color: p.color ?? STATUS_COLOR[p.status] ?? '#6b7280',
                  fillColor: p.color ?? STATUS_COLOR[p.status] ?? '#6b7280',
                  fillOpacity: 0.6,
                  weight: 2,
                }}
                eventHandlers={{ click: () => onSelect?.(p.id) }}
              >
                <Popup>
                  <strong>{p.name}</strong><br />
                  {p.hectares} ha · {p.status}
                  {p.currentCrop && <><br />{p.currentCrop}</>}
                </Popup>
              </CircleMarker>
            );
          }

          const color = p.color ?? STATUS_COLOR[p.status] ?? '#6b7280';
          const isSelected = p.id === selectedId;

          return (
            <Polygon
              key={p.id}
              positions={p.polygon}
              pathOptions={{
                color: isSelected ? '#1d4ed8' : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.45 : 0.3,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{ click: () => onSelect?.(p.id) }}
            >
              <Popup>
                <strong>{p.name}</strong><br />
                {p.hectares} ha · {p.status}
                {p.currentCrop && <><br />{p.currentCrop}</>}
              </Popup>
            </Polygon>
          );
        })}

        {/* Paddock name labels — rendered as map-native DivIcon, no box */}
        {paddocks.map((p) => {
          const centre = p.polygon && p.polygon.length >= 3
            ? centroidOf(p.polygon)
            : p.coordinates;
          if (!centre) return null;
          return (
            <Marker
              key={`lbl-${p.id}`}
              position={centre}
              icon={makeLabelIcon(p.name, p.currentCrop, p.hectares)}
              interactive={false}
              zIndexOffset={-100}
            />
          );
        })}

        {/* Saved fence lines */}
        {fenceLines.map((fl) => (
          <Polyline
            key={fl.id}
            positions={fl.points}
            pathOptions={{ color: fl.color ?? '#78350f', weight: 2.5, opacity: 0.95 }}
          >
            <Popup><strong>{fl.name}</strong><br />Fence line</Popup>
          </Polyline>
        ))}

        {/* Map feature markers (sheds, troughs, dams, gates) */}
        {mapFeatures.map((mf) => (
          <Marker
            key={mf.id}
            position={mf.coordinates}
            icon={makeFeatureIcon(mf.type, mf.name)}
            zIndexOffset={200}
          >
            <Popup>
              <strong>{mf.name}</strong><br />
              {FEATURE_META[mf.type].label}
              {mf.notes && <><br />{mf.notes}</>}
            </Popup>
          </Marker>
        ))}

        {/* Drawing layer */}
        {isDrawingPaddock && (
          <DrawLayer
            points={drawPoints}
            color={drawColor}
            onAddPoint={handleAddPoint}
            onMovePoint={handleMovePoint}
            onClose={handleClose}
          />
        )}

        {/* Fence drawing layer */}
        {isDrawingFence && (
          <FenceLayer
            points={fencePoints}
            color={drawColor}
            onAddPoint={handleFenceAddPoint}
            onMovePoint={handleFenceMovePoint}
            onFinish={handleFenceFinish}
          />
        )}

        {/* Feature placement layer */}
        {!!placingType && (
          <FeaturePlaceLayer onPlace={handleFeaturePlace} />
        )}
      </MapContainer>

      {/* Drawing controls overlay (paddock + fence modes) */}
      {(isDrawingPaddock || isDrawingFence) && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2">
          {/* Colour picker row */}
          <div className="flex items-center gap-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 mr-1">Colour:</span>
            {DRAW_COLORS.map((hex) => (
              <button
                key={hex}
                onClick={() => setDrawColor(hex)}
                style={{ background: hex }}
                className={`w-6 h-6 rounded-full transition-all flex-shrink-0 ${
                  drawColor === hex ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={hex}
              />
            ))}
          </div>
          {/* Status / action bar */}
          <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg border border-gray-200 dark:border-gray-700">
            {isDrawingPaddock && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {drawPoints.length === 0
                  ? 'Click map to place boundary points · drag points to adjust'
                  : drawPoints.length < 3
                  ? `${drawPoints.length} point${drawPoints.length > 1 ? 's' : ''} — keep clicking to add corners`
                  : `${drawPoints.length} pts · ~${polygonHectares(drawPoints)} ha — drag to refine · dbl-click or ✓ to finish`}
              </span>
            )}
            {isDrawingFence && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {fencePoints.length === 0
                  ? 'Click map to start drawing fence · drag points to adjust'
                  : fencePoints.length < 2
                  ? '1 point — click to add more vertices'
                  : `${fencePoints.length} pts — dbl-click or ✓ to finish`}
              </span>
            )}
            {isDrawingPaddock && drawPoints.length > 0 && (
              <>
                <button onClick={handleUndo} className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors">Undo</button>
                <button onClick={handleReset} className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors">Reset</button>
              </>
            )}
            {isDrawingFence && fencePoints.length > 0 && (
              <>
                <button onClick={handleFenceUndo} className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors">Undo</button>
                <button onClick={handleFenceReset} className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors">Reset</button>
              </>
            )}
            {isDrawingPaddock && drawPoints.length >= 3 && (
              <button onClick={handleClose} className="text-xs px-3 py-1 rounded-lg bg-farm-700 hover:bg-farm-800 text-white font-semibold transition-colors">✓ Close Shape</button>
            )}
            {isDrawingFence && fencePoints.length >= 2 && (
              <button onClick={handleFenceFinish} className="text-xs px-3 py-1 rounded-lg bg-farm-700 hover:bg-farm-800 text-white font-semibold transition-colors">✓ Save Fence</button>
            )}
          </div>
        </div>
      )}

      {/* Feature placement hint */}
      {!!placingType && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg border border-gray-200 dark:border-gray-700">
            <span className="text-lg">{FEATURE_META[placingType].emoji}</span>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              Click on the map to place <strong>{FEATURE_META[placingType].label}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
