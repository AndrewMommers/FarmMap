// ─── Core Domain Types ────────────────────────────────────────────────────────

export type FarmType =
  | 'cropping' | 'livestock' | 'dairy' | 'poultry' | 'horticulture'
  | 'aquaculture' | 'mixed' | 'vineyard' | 'sugar' | 'cotton';

export type State = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

// ─── Farm ────────────────────────────────────────────────────────────────────

export interface Farm {
  id: string;
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

export interface User {
  id: string;
  farmId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  active: boolean;
  lastLogin?: string;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface AppState {
  activeFarmId: string;
  sidebarOpen: boolean;
}
