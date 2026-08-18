// ─── Core Domain Types ────────────────────────────────────────────────────────

export type FarmType =
  | 'cropping' | 'livestock' | 'dairy' | 'poultry' | 'horticulture'
  | 'aquaculture' | 'mixed' | 'vineyard' | 'sugar' | 'cotton';

export type State = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

// ─── Farm ────────────────────────────────────────────────────────────────────

export interface Farm {
  id: string;
  /** The farm's actual owner — the Supabase Auth user ID `farms.user_id` is
   *  keyed on. Distinct from `owner` below, which is just a display name. */
  userId: string;
  name: string;
  owner: string;
  type: FarmType;
  totalHectares: number;
  state: State;
  region: string;
  address: string;
  abn: string;
  createdAt: string;
}

// ─── Paddock / Field ─────────────────────────────────────────────────────────

export type PaddockStatus = 'active' | 'fallow' | 'harvested' | 'locked';

export interface Paddock {
  id: string;
  farmId: string;
  name: string;
  hectares: number;
  soilType: string;
  status: PaddockStatus;
  currentCrop?: string;
  lastActivity?: string;
  notes?: string;
  color?: string;               // custom map colour (hex)
  coordinates?: [number, number]; // lat, lng centroid
  polygon?: [number, number][]; // lat/lng array defining the drawn boundary
  // ── Telematics link ───────────────────────────────────────────────────────
  externalProvider?: IntegrationProvider; // set if this boundary was imported/matched from a provider
  externalBoundaryId?: string;            // provider's field boundary ID
}

// ─── Map Features & Fence Lines ───────────────────────────────────────────────

export type MapFeatureType = 'shed' | 'water_trough' | 'dam' | 'gate';

export interface FenceLine {
  id: string;
  farmId: string;
  name: string;
  points: [number, number][];
  color?: string;
}

export interface MapFeature {
  id: string;
  farmId: string;
  type: MapFeatureType;
  name: string;
  coordinates: [number, number];
  notes?: string;
}

// ─── Livestock ───────────────────────────────────────────────────────────────

export type LivestockSpecies = 'cattle' | 'sheep' | 'goat' | 'pig' | 'chicken' | 'turkey' | 'horse' | 'alpaca' | 'other';
export type LivestockStatus = 'healthy' | 'sick' | 'quarantine' | 'sold' | 'deceased';
export type LivestockGender = 'male' | 'female' | 'castrated';

export interface LivestockAnimal {
  id: string;
  farmId: string;
  tag: string; // NLIS tag or paddock tag
  species: LivestockSpecies;
  breed: string;
  gender: LivestockGender;
  dob?: string;
  weightKg?: number;
  status: LivestockStatus;
  paddockId?: string;
  notes?: string;
  lastVetVisit?: string;
  purchaseDate?: string;
  purchasePriceAUD?: number;
}

export interface LivestockMobGroup {
  id: string;
  farmId: string;
  name: string;
  species: LivestockSpecies;
  count: number;
  paddockId?: string;
  notes?: string;
}

// ─── Crops ───────────────────────────────────────────────────────────────────

export type CropStatus = 'planned' | 'planted' | 'growing' | 'ready' | 'harvested' | 'failed';

export interface CropRecord {
  id: string;
  farmId: string;
  paddockId: string;
  cropName: string;
  variety?: string;
  season: string; // e.g. "2024-25"
  plantingDate?: string;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  status: CropStatus;
  seedRateKgHa?: number;
  expectedYieldTonnesHa?: number;
  actualYieldTonnesHa?: number;
  irrigated: boolean;
  notes?: string;
}

export interface SprayRecord {
  id: string;
  farmId: string;
  paddockId: string;
  date: string;
  product: string;
  ratePerHa: number;
  unit: string;
  operator: string;
  withholdingDays?: number;
  purpose: string; // herbicide, fungicide, insecticide, fertiliser
  notes?: string;
}

// ─── Equipment ───────────────────────────────────────────────────────────────

export type EquipmentStatus = 'operational' | 'maintenance' | 'repair' | 'decommissioned';
export type EquipmentCategory = 'tractor' | 'harvester' | 'planter' | 'sprayer' | 'vehicle' | 'pump' | 'irrigation' | 'shed' | 'other';

export interface Equipment {
  id: string;
  farmId: string;
  name: string;
  category: EquipmentCategory;
  make: string;
  model: string;
  year?: number;
  serialNumber?: string;
  status: EquipmentStatus;
  lastServiceDate?: string;
  nextServiceDate?: string;
  hoursOrKm?: number;
  purchaseDate?: string;
  purchasePriceAUD?: number;
  notes?: string;
  // ── Telematics link (see IntegrationProvider) ────────────────────────────
  externalProvider?: IntegrationProvider; // e.g. 'john_deere' if this machine is synced from a telematics platform
  externalId?: string;          // provider's machine/asset ID
  engineHoursSynced?: number;   // last engine-hours reading pulled from the provider
  lastTelemetryAt?: string;     // ISO timestamp of the last successful telemetry sync
  lastLocation?: [number, number]; // [lat, lng] of last known machine position
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  date: string;
  type: 'service' | 'repair' | 'inspection';
  description: string;
  costAUD?: number;
  technician?: string;
  nextDueDate?: string;
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';
export type TransactionCategory =
  | 'livestock_sale' | 'crop_sale' | 'produce_sale' | 'agistment' | 'government_payment'
  | 'fuel' | 'fertiliser' | 'chemical' | 'seed' | 'feed' | 'veterinary'
  | 'labour' | 'machinery' | 'repairs' | 'insurance' | 'rates' | 'utilities'
  | 'freight' | 'professional_fees' | 'other_income' | 'other_expense';

export interface Transaction {
  id: string;
  farmId: string;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amountAUD: number;
  gstIncluded: boolean;
  supplier?: string;
  invoiceNumber?: string;
  paddockId?: string;
  notes?: string;
  // ── Finance integration link (see IntegrationProvider) ───────────────────
  externalProvider?: IntegrationProvider; // e.g. 'xero' if synced from accounting software, 'zepto' if paid via real-time bank payment
  externalId?: string;          // provider's transaction/invoice/payment ID
  paymentStatus?: 'pending' | 'completed' | 'failed'; // payment lifecycle, mainly relevant for Zepto-initiated payments
}

export interface Budget {
  id: string;
  farmId: string;
  financialYear: string; // e.g. "2024-25"
  category: TransactionCategory;
  budgetedAUD: number;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export type InventoryUnit = 'kg' | 'L' | 'tonne' | 'bag' | 'bale' | 'unit' | 'm';
export type InventoryCategory = 'chemical' | 'fertiliser' | 'seed' | 'feed' | 'fuel' | 'parts' | 'other';

export interface InventoryItem {
  id: string;
  farmId: string;
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  quantity: number;
  minStockLevel?: number;
  location?: string;
  supplier?: string;
  costPerUnit?: number;
  expiryDate?: string;
  notes?: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  farmId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
  completedDate?: string;
  paddockId?: string;
  equipmentId?: string;
  category: string;
  notes?: string;
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export interface WeatherReading {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  rainfallMm: number;
  humidityPct?: number;
  windKph?: number;
  evapMm?: number;
}

export interface RainfallSummary {
  month: string;
  rainfallMm: number;
  avgRainfallMm: number;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'manager' | 'operator' | 'agronomist' | 'accountant' | 'readonly';

/** Resource groupings the role-permission matrix is keyed on — mirrors the
 *  `resource` strings the has_farm_permission() Postgres function switches
 *  on in supabase/schema.sql. Keep these in sync. */
export type PermissionResource =
  | 'paddocks' | 'livestock' | 'crops' | 'equipment' | 'finance' | 'inventory'
  | 'tasks' | 'devices' | 'announcements' | 'team' | 'integrations';

export type PermissionLevel = 'read' | 'write' | 'none';

export interface User {
  id: string;
  farmId: string;
  /** Links this team-directory row to a real Supabase Auth account, when one exists.
   *  Unset for teammates who are contacts only, or a pending invite not yet accepted. */
  userId?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  /** A single emoji chosen as this person's avatar; falls back to initials when unset. */
  avatar?: string;
  active: boolean;
  lastLogin?: string;
  /** Sparse per-resource override on top of the role's default permissions.
   *  No owner-facing UI to edit this yet — see docs/FEATURES.md. */
  customPermissions?: Partial<Record<PermissionResource, PermissionLevel>>;
}

// ─── Announcements ──────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  farmId: string;
  authorName: string;
  message: string;
  createdAt: string;
}

// ─── Devices (Tractor Mode) ─────────────────────────────────────────────────────
// A "device" is a browser/tablet registered from inside the cab so it can be
// named, assigned to an operator, and revoked from Settings. Registration
// always happens from an already-authenticated session on that device itself
// (see docs/DEVICES.md for the security model) — it is not a separate login.

export type DeviceStatus = 'active' | 'revoked';

export interface Device {
  id: string;
  farmId: string;
  name: string;                 // e.g. "8R Cab Tablet", "Ute Phone"
  assignedUserId?: string;      // optional User.id this device usually rides with
  status: DeviceStatus;
  lastActiveAt?: string;
  /** GPS position, foreground-only, reported while Tractor Mode is open on
   *  this device (see docs/GEOFENCING.md). [lat, lng]. */
  lastLocation?: [number, number];
  lastLocationAt?: string;
  createdAt: string;
}

// ─── Geofencing ──────────────────────────────────────────────────────────────
// A device's live position is checked against paddock boundaries (reusing
// Paddock.polygon — no separate zone-drawing tool). Crossing a boundary logs
// an event here, farm-owner-visible from Settings → Devices.

export type GeofenceEventType = 'enter' | 'exit';

export interface GeofenceEvent {
  id: string;
  farmId: string;
  deviceId: string;
  paddockId: string;
  type: GeofenceEventType;
  occurredAt: string;
}

// ─── Equipment Telematics Integrations ─────────────────────────────────────────
// A farm connects an external ag-telematics platform (OAuth) so machine hours,
// GPS location and field boundaries stay in sync automatically. Tokens are held
// server-side only (Supabase Edge Functions) — never in the client or this type.

export type IntegrationProvider = 'john_deere' | 'xero' | 'zepto';

export type IntegrationStatus = 'disconnected' | 'connected' | 'error' | 'expired';

export interface IntegrationConnection {
  id: string;
  farmId: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  externalOrgId?: string;    // provider's organisation/account ID this farm is linked to
  externalOrgName?: string;
  scopes?: string[];
  connectedAt?: string;
  lastSyncAt?: string;
  lastError?: string;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface AppState {
  activeFarmId: string;
  sidebarOpen: boolean;
}
