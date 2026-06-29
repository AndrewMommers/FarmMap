import type {
  Farm, Paddock, LivestockAnimal, LivestockMobGroup, CropRecord, SprayRecord,
  Equipment, MaintenanceLog, Transaction, Budget, InventoryItem, Task,
  WeatherReading, RainfallSummary, User, FenceLine, MapFeature,
} from '../types';

// ─── Farm ─────────────────────────────────────────────────────────────────────

export const farms: Farm[] = [
  {
    id: 'farm-1',
    name: 'Riverdale Station',
    owner: 'James Mackenzie',
    type: 'mixed',
    totalHectares: 4820,
    state: 'NSW',
    region: 'Riverina',
    address: '1482 Kidman Way, Hillston NSW 2675',
    abn: '51 234 567 890',
    createdAt: '2020-01-15',
  },
  {
    id: 'farm-2',
    name: 'Red Gum Grazing',
    owner: 'Sarah Thornton',
    type: 'livestock',
    totalHectares: 2100,
    state: 'VIC',
    region: 'Wimmera',
    address: '45 Horsham-Natimuk Rd, Horsham VIC 3400',
    abn: '73 987 654 321',
    createdAt: '2019-06-01',
  },
];

// ─── Paddocks ─────────────────────────────────────────────────────────────────

export const paddocks: Paddock[] = [
  // Farm 1 – Riverdale Station
  { id: 'p-1', farmId: 'farm-1', name: 'North Flat', hectares: 480, soilType: 'Red Kandosol', status: 'active', currentCrop: 'Winter Wheat', lastActivity: '2025-05-20', coordinates: [-33.48, 145.52] },
  { id: 'p-2', farmId: 'farm-1', name: 'South Creek', hectares: 320, soilType: 'Grey Vertosol', status: 'active', currentCrop: 'Canola', lastActivity: '2025-05-18', coordinates: [-33.50, 145.51] },
  { id: 'p-3', farmId: 'farm-1', name: 'Eastern Rise', hectares: 550, soilType: 'Red Sodosol', status: 'fallow', lastActivity: '2025-03-10', coordinates: [-33.47, 145.55] },
  { id: 'p-4', farmId: 'farm-1', name: 'House Paddock', hectares: 120, soilType: 'Sandy loam', status: 'active', currentCrop: 'Lucerne', lastActivity: '2025-06-01', coordinates: [-33.49, 145.50] },
  { id: 'p-5', farmId: 'farm-1', name: 'Bore Run', hectares: 890, soilType: 'Red Earth', status: 'active', currentCrop: 'Pasture', lastActivity: '2025-05-30', coordinates: [-33.51, 145.56] },
  { id: 'p-6', farmId: 'farm-1', name: 'Back Country', hectares: 1200, soilType: 'Mitchell grass', status: 'active', currentCrop: 'Native Pasture', lastActivity: '2025-06-10', coordinates: [-33.53, 145.58] },
  { id: 'p-7', farmId: 'farm-1', name: 'Dam Flat', hectares: 260, soilType: 'Black Vertosol', status: 'harvested', lastActivity: '2025-04-15', coordinates: [-33.46, 145.53] },
  { id: 'p-8', farmId: 'farm-1', name: 'Windmill Block', hectares: 310, soilType: 'Red Chromosol', status: 'fallow', lastActivity: '2025-02-20', coordinates: [-33.52, 145.54] },
  // Farm 2 – Red Gum Grazing
  { id: 'rg-1', farmId: 'farm-2', name: 'Creek Flats', hectares: 280, soilType: 'Grey Dermosol', status: 'active', currentCrop: 'Sub-clover/Ryegrass', lastActivity: '2025-06-15', coordinates: [-36.71, 142.02] },
  { id: 'rg-2', farmId: 'farm-2', name: 'Mallee Block', hectares: 560, soilType: 'Calcarosol', status: 'active', currentCrop: 'Native Pasture', lastActivity: '2025-06-10', coordinates: [-36.73, 142.05] },
  { id: 'rg-3', farmId: 'farm-2', name: 'Red Gum Paddock', hectares: 340, soilType: 'Brown Chromosol', status: 'active', currentCrop: 'Lucerne', lastActivity: '2025-06-20', coordinates: [-36.70, 142.00] },
  { id: 'rg-4', farmId: 'farm-2', name: 'Hill Country', hectares: 620, soilType: 'Red Kandosol', status: 'fallow', lastActivity: '2025-04-01', coordinates: [-36.75, 142.08] },
  { id: 'rg-5', farmId: 'farm-2', name: 'Home Paddock', hectares: 300, soilType: 'Sandy loam', status: 'active', currentCrop: 'Oaten Hay', lastActivity: '2025-06-18', coordinates: [-36.72, 142.01] },
];

// ─── Livestock ────────────────────────────────────────────────────────────────

export const livestockMobs: LivestockMobGroup[] = [
  // Farm 1
  { id: 'mob-1', farmId: 'farm-1', name: 'Merino Ewes – Bore Run', species: 'sheep', count: 1240, paddockId: 'p-5' },
  { id: 'mob-2', farmId: 'farm-1', name: 'Wether Store – Back Country', species: 'sheep', count: 880, paddockId: 'p-6' },
  { id: 'mob-3', farmId: 'farm-1', name: 'Angus Breeders', species: 'cattle', count: 145, paddockId: 'p-3' },
  { id: 'mob-4', farmId: 'farm-1', name: 'Angus Steers Grow-out', species: 'cattle', count: 88, paddockId: 'p-8' },
  { id: 'mob-5', farmId: 'farm-1', name: 'Ram Paddock', species: 'sheep', count: 42, paddockId: 'p-4' },
  // Farm 2
  { id: 'mob-6', farmId: 'farm-2', name: 'Prime Lambs – Creek Flats', species: 'sheep', count: 820, paddockId: 'rg-1' },
  { id: 'mob-7', farmId: 'farm-2', name: 'Merino Ewes – Mallee Block', species: 'sheep', count: 640, paddockId: 'rg-2' },
  { id: 'mob-8', farmId: 'farm-2', name: 'Angus Cows & Calves', species: 'cattle', count: 220, paddockId: 'rg-4' },
  { id: 'mob-9', farmId: 'farm-2', name: 'Replacement Heifers', species: 'cattle', count: 60, paddockId: 'rg-3' },
];

export const livestock: LivestockAnimal[] = [
  // Farm 1
  { id: 'l-1', farmId: 'farm-1', tag: 'NSW1234567', species: 'cattle', breed: 'Angus', gender: 'castrated', dob: '2023-09-12', weightKg: 310, status: 'healthy', paddockId: 'p-3', purchaseDate: '2024-03-01', purchasePriceAUD: 1200 },
  { id: 'l-2', farmId: 'farm-1', tag: 'NSW1234568', species: 'cattle', breed: 'Angus', gender: 'castrated', dob: '2023-09-14', weightKg: 295, status: 'healthy', paddockId: 'p-3', purchaseDate: '2024-03-01', purchasePriceAUD: 1100 },
  { id: 'l-3', farmId: 'farm-1', tag: 'NSW1234569', species: 'cattle', breed: 'Angus', gender: 'female', dob: '2020-08-05', weightKg: 540, status: 'healthy', paddockId: 'p-3' },
  { id: 'l-4', farmId: 'farm-1', tag: 'NSW2345678', species: 'cattle', breed: 'Angus', gender: 'male', dob: '2019-04-20', weightKg: 820, status: 'healthy', paddockId: 'p-4', notes: 'Herd sire – do not sell' },
  { id: 'l-5', farmId: 'farm-1', tag: 'NSW3456789', species: 'cattle', breed: 'Angus', gender: 'castrated', dob: '2023-10-01', weightKg: 285, status: 'sick', paddockId: 'p-3', lastVetVisit: '2025-06-05', notes: 'Respiratory issue – under treatment' },
  // Farm 2
  { id: 'l-6', farmId: 'farm-2', tag: 'VIC4001234', species: 'cattle', breed: 'Angus', gender: 'female', dob: '2021-09-05', weightKg: 520, status: 'healthy', paddockId: 'rg-4' },
  { id: 'l-7', farmId: 'farm-2', tag: 'VIC4001235', species: 'cattle', breed: 'Angus', gender: 'female', dob: '2021-10-12', weightKg: 495, status: 'healthy', paddockId: 'rg-4' },
  { id: 'l-8', farmId: 'farm-2', tag: 'VIC4001236', species: 'cattle', breed: 'Angus', gender: 'male', dob: '2018-05-10', weightKg: 940, status: 'healthy', paddockId: 'rg-3', notes: 'Herd sire' },
];

// ─── Crops ────────────────────────────────────────────────────────────────────

export const crops: CropRecord[] = [
  // Farm 1
  { id: 'c-1', farmId: 'farm-1', paddockId: 'p-1', cropName: 'Winter Wheat', variety: 'Sunguard', season: '2025', plantingDate: '2025-04-28', expectedHarvestDate: '2025-11-15', status: 'growing', seedRateKgHa: 80, expectedYieldTonnesHa: 4.2, irrigated: false },
  { id: 'c-2', farmId: 'farm-1', paddockId: 'p-2', cropName: 'Canola', variety: 'Hyola 970CL', season: '2025', plantingDate: '2025-04-20', expectedHarvestDate: '2025-10-25', status: 'growing', seedRateKgHa: 3, expectedYieldTonnesHa: 2.0, irrigated: false },
  { id: 'c-3', farmId: 'farm-1', paddockId: 'p-7', cropName: 'Barley', variety: 'Laperouse', season: '2025', plantingDate: '2025-04-15', expectedHarvestDate: '2025-10-10', actualHarvestDate: '2025-10-08', status: 'harvested', seedRateKgHa: 75, expectedYieldTonnesHa: 3.8, actualYieldTonnesHa: 3.6, irrigated: false },
  { id: 'c-4', farmId: 'farm-1', paddockId: 'p-4', cropName: 'Lucerne', variety: 'Sardi 10', season: '2025', plantingDate: '2025-02-10', status: 'growing', seedRateKgHa: 10, expectedYieldTonnesHa: 12, irrigated: true },
  // Farm 2
  { id: 'c-5', farmId: 'farm-2', paddockId: 'rg-3', cropName: 'Lucerne', variety: 'Aurora', season: '2025', plantingDate: '2025-02-15', status: 'growing', seedRateKgHa: 8, expectedYieldTonnesHa: 10, irrigated: true },
  { id: 'c-6', farmId: 'farm-2', paddockId: 'rg-5', cropName: 'Oaten Hay', variety: 'Nifty', season: '2025', plantingDate: '2025-04-10', expectedHarvestDate: '2025-10-01', status: 'growing', seedRateKgHa: 90, expectedYieldTonnesHa: 6.5, irrigated: false },
];

export const sprayRecords: SprayRecord[] = [
  // Farm 1
  { id: 's-1', farmId: 'farm-1', paddockId: 'p-1', date: '2025-05-05', product: 'Glyphosate 450', ratePerHa: 1.5, unit: 'L', operator: 'Tom Walsh', withholdingDays: 7, purpose: 'herbicide', notes: 'Pre-emergent weed control' },
  { id: 's-2', farmId: 'farm-1', paddockId: 'p-2', date: '2025-05-12', product: 'Trifluralin 480', ratePerHa: 1.2, unit: 'L', operator: 'Tom Walsh', withholdingDays: 0, purpose: 'herbicide' },
  { id: 's-3', farmId: 'farm-1', paddockId: 'p-1', date: '2025-06-02', product: 'Urea 46%', ratePerHa: 100, unit: 'kg', operator: 'James Mackenzie', purpose: 'fertiliser' },
  // Farm 2
  { id: 's-4', farmId: 'farm-2', paddockId: 'rg-1', date: '2025-05-20', product: 'Roundup PowerMax', ratePerHa: 2.0, unit: 'L', operator: 'Sarah Thornton', withholdingDays: 7, purpose: 'herbicide', notes: 'Pre-winter pasture renovation' },
  { id: 's-5', farmId: 'farm-2', paddockId: 'rg-5', date: '2025-06-05', product: 'Ammonium Nitrate', ratePerHa: 80, unit: 'kg', operator: 'Sarah Thornton', purpose: 'fertiliser' },
];

// ─── Equipment ────────────────────────────────────────────────────────────────

export const equipment: Equipment[] = [
  // Farm 1
  { id: 'eq-1', farmId: 'farm-1', name: 'John Deere 8R 370', category: 'tractor', make: 'John Deere', model: '8R 370', year: 2021, serialNumber: '1RW8370RXMM123456', status: 'operational', lastServiceDate: '2025-03-15', nextServiceDate: '2025-09-15', hoursOrKm: 1240, purchasePriceAUD: 485000 },
  { id: 'eq-2', farmId: 'farm-1', name: 'New Holland CR9.90', category: 'harvester', make: 'New Holland', model: 'CR9.90', year: 2019, serialNumber: 'YCG612345', status: 'operational', lastServiceDate: '2025-02-20', nextServiceDate: '2025-09-01', hoursOrKm: 2860, purchasePriceAUD: 920000 },
  { id: 'eq-3', farmId: 'farm-1', name: 'Case IH Patriot 4430', category: 'sprayer', make: 'Case IH', model: 'Patriot 4430', year: 2020, serialNumber: 'YCCP44302M1234', status: 'operational', lastServiceDate: '2025-04-10', nextServiceDate: '2025-10-10', hoursOrKm: 680 },
  { id: 'eq-4', farmId: 'farm-1', name: 'Massey Ferguson 7726', category: 'tractor', make: 'Massey Ferguson', model: '7726 Dyna-VT', year: 2018, serialNumber: 'AGCO7726X1234', status: 'maintenance', lastServiceDate: '2025-05-01', nextServiceDate: '2025-06-30', hoursOrKm: 3450, notes: 'Hydraulic pump replacement scheduled' },
  { id: 'eq-5', farmId: 'farm-1', name: 'Toyota LandCruiser 79', category: 'vehicle', make: 'Toyota', model: 'LandCruiser 79 Series', year: 2022, status: 'operational', lastServiceDate: '2025-04-01', nextServiceDate: '2025-10-01', hoursOrKm: 48200 },
  { id: 'eq-6', farmId: 'farm-1', name: 'Bauer Centre Pivot – House Paddock', category: 'irrigation', make: 'Bauer', model: 'LinearMove 600', year: 2017, status: 'operational', lastServiceDate: '2025-01-20', nextServiceDate: '2025-07-20' },
  // Farm 2
  { id: 'eq-7', farmId: 'farm-2', name: 'New Holland T7.260', category: 'tractor', make: 'New Holland', model: 'T7.260', year: 2020, serialNumber: 'NH7260VIC1001', status: 'operational', lastServiceDate: '2025-04-10', nextServiceDate: '2025-10-10', hoursOrKm: 1850, purchasePriceAUD: 295000 },
  { id: 'eq-8', farmId: 'farm-2', name: 'Toyota HiLux SR5', category: 'vehicle', make: 'Toyota', model: 'HiLux SR5', year: 2023, status: 'operational', lastServiceDate: '2025-05-01', nextServiceDate: '2025-11-01', hoursOrKm: 28400 },
  { id: 'eq-9', farmId: 'farm-2', name: 'Husqvarna TE 150i Motorbike', category: 'vehicle', make: 'Husqvarna', model: 'TE 150i', year: 2022, status: 'operational', lastServiceDate: '2025-03-01', nextServiceDate: '2025-09-01', hoursOrKm: 4100, notes: 'Mustering bike' },
  { id: 'eq-10', farmId: 'farm-2', name: 'K-Line Irrigation – Creek Flats', category: 'irrigation', make: 'K-Line', model: 'Pod System', year: 2018, status: 'operational', lastServiceDate: '2025-01-15', nextServiceDate: '2025-07-15' },
];

export const maintenanceLogs: MaintenanceLog[] = [
  { id: 'ml-1', equipmentId: 'eq-1', date: '2025-03-15', type: 'service', description: '500hr engine service – filters, fluids, belts', costAUD: 2800, technician: 'Rural Ag Services', nextDueDate: '2025-09-15' },
  { id: 'ml-2', equipmentId: 'eq-4', date: '2025-05-01', type: 'repair', description: 'Hydraulic pump assessment – parts ordered', costAUD: 450, technician: 'Massey Ferguson Dealer' },
  { id: 'ml-3', equipmentId: 'eq-2', date: '2025-02-20', type: 'service', description: 'Pre-harvest service – concaves, sieves, belts', costAUD: 5200, technician: 'NH Rural', nextDueDate: '2025-09-01' },
  { id: 'ml-4', equipmentId: 'eq-7', date: '2025-04-10', type: 'service', description: '1000hr service – engine oil, filters, DEF', costAUD: 1850, technician: 'NH Horsham', nextDueDate: '2025-10-10' },
  { id: 'ml-5', equipmentId: 'eq-8', date: '2025-05-01', type: 'service', description: '30,000km service', costAUD: 620, technician: 'Horsham Toyota', nextDueDate: '2025-11-01' },
];

// ─── Finance ──────────────────────────────────────────────────────────────────

export const transactions: Transaction[] = [
  // Farm 1
  { id: 't-1', farmId: 'farm-1', date: '2025-06-10', type: 'income', category: 'livestock_sale', description: 'Merino wool clip – 42 bales', amountAUD: 84600, gstIncluded: true, supplier: 'Elders Wool' },
  { id: 't-2', farmId: 'farm-1', date: '2025-06-05', type: 'income', category: 'livestock_sale', description: 'Merino wethers (220 hd) saleyards', amountAUD: 52800, gstIncluded: true, supplier: 'Griffith Saleyards' },
  { id: 't-3', farmId: 'farm-1', date: '2025-05-28', type: 'expense', category: 'fuel', description: 'Diesel – seeding campaign', amountAUD: 12400, gstIncluded: true, supplier: 'United Petroleum' },
  { id: 't-4', farmId: 'farm-1', date: '2025-05-20', type: 'expense', category: 'seed', description: 'Wheat seed – Sunguard 38 tonnes', amountAUD: 28500, gstIncluded: true, supplier: 'AGnVET Services' },
  { id: 't-5', farmId: 'farm-1', date: '2025-05-15', type: 'expense', category: 'fertiliser', description: 'MAP 18:20 – 80 tonnes', amountAUD: 51200, gstIncluded: true, supplier: 'Incitec Pivot' },
  { id: 't-6', farmId: 'farm-1', date: '2025-05-10', type: 'expense', category: 'labour', description: 'Casual shearing labour', amountAUD: 8900, gstIncluded: true },
  { id: 't-7', farmId: 'farm-1', date: '2025-04-30', type: 'income', category: 'crop_sale', description: 'Barley sale – 936 tonnes @ $285', amountAUD: 266760, gstIncluded: true, supplier: 'GrainCorp Griffith' },
  { id: 't-8', farmId: 'farm-1', date: '2025-04-15', type: 'expense', category: 'veterinary', description: 'Cattle vaccination + drenching', amountAUD: 3200, gstIncluded: true, supplier: 'Hillston Vet Clinic' },
  { id: 't-9', farmId: 'farm-1', date: '2025-04-01', type: 'expense', category: 'insurance', description: 'Farm package insurance – annual', amountAUD: 24800, gstIncluded: true, supplier: 'Rural Bank Insurance' },
  { id: 't-10', farmId: 'farm-1', date: '2025-03-20', type: 'expense', category: 'repairs', description: 'Fence repairs – Back Country', amountAUD: 4200, gstIncluded: true },
  { id: 't-11', farmId: 'farm-1', date: '2025-03-10', type: 'expense', category: 'chemical', description: 'Herbicide + fungicide inputs', amountAUD: 18600, gstIncluded: true, supplier: 'Landmark Griffith' },
  { id: 't-12', farmId: 'farm-1', date: '2025-02-28', type: 'income', category: 'government_payment', description: 'Farm Household Allowance', amountAUD: 9600, gstIncluded: false },
  // Farm 2
  { id: 't-13', farmId: 'farm-2', date: '2025-06-12', type: 'income', category: 'livestock_sale', description: 'Prime lamb sales – 380 hd @ $182', amountAUD: 69160, gstIncluded: true, supplier: 'Horsham Saleyards' },
  { id: 't-14', farmId: 'farm-2', date: '2025-06-01', type: 'income', category: 'livestock_sale', description: 'Merino wool – 28 bales', amountAUD: 54600, gstIncluded: true, supplier: 'AWH Horsham' },
  { id: 't-15', farmId: 'farm-2', date: '2025-05-25', type: 'expense', category: 'fuel', description: 'Diesel – tractor and ute', amountAUD: 4200, gstIncluded: true, supplier: 'Caltex Horsham' },
  { id: 't-16', farmId: 'farm-2', date: '2025-05-18', type: 'expense', category: 'veterinary', description: 'Lamb marking – vaccines + labour', amountAUD: 2800, gstIncluded: true, supplier: 'Wimmera Vet Group' },
  { id: 't-17', farmId: 'farm-2', date: '2025-05-10', type: 'expense', category: 'fertiliser', description: 'Urea – pasture top-dress', amountAUD: 14400, gstIncluded: true, supplier: 'Landmark Horsham' },
  { id: 't-18', farmId: 'farm-2', date: '2025-04-20', type: 'expense', category: 'insurance', description: 'Farm package insurance – annual', amountAUD: 16800, gstIncluded: true, supplier: 'Rural Bank Insurance' },
  { id: 't-19', farmId: 'farm-2', date: '2025-04-10', type: 'expense', category: 'labour', description: 'Shearing – 640 ewes', amountAUD: 5760, gstIncluded: true },
  { id: 't-20', farmId: 'farm-2', date: '2025-03-28', type: 'income', category: 'government_payment', description: 'AgriStarter Grant – VIC', amountAUD: 15000, gstIncluded: false },
];

export const budgets: Budget[] = [
  // Farm 1
  { id: 'b-1', farmId: 'farm-1', financialYear: '2024-25', category: 'crop_sale', budgetedAUD: 450000 },
  { id: 'b-2', farmId: 'farm-1', financialYear: '2024-25', category: 'livestock_sale', budgetedAUD: 180000 },
  { id: 'b-3', farmId: 'farm-1', financialYear: '2024-25', category: 'fuel', budgetedAUD: 45000 },
  { id: 'b-4', farmId: 'farm-1', financialYear: '2024-25', category: 'fertiliser', budgetedAUD: 80000 },
  { id: 'b-5', farmId: 'farm-1', financialYear: '2024-25', category: 'seed', budgetedAUD: 35000 },
  { id: 'b-6', farmId: 'farm-1', financialYear: '2024-25', category: 'labour', budgetedAUD: 60000 },
  { id: 'b-7', farmId: 'farm-1', financialYear: '2024-25', category: 'insurance', budgetedAUD: 25000 },
  // Farm 2
  { id: 'b-8', farmId: 'farm-2', financialYear: '2024-25', category: 'livestock_sale', budgetedAUD: 160000 },
  { id: 'b-9', farmId: 'farm-2', financialYear: '2024-25', category: 'fuel', budgetedAUD: 18000 },
  { id: 'b-10', farmId: 'farm-2', financialYear: '2024-25', category: 'fertiliser', budgetedAUD: 22000 },
  { id: 'b-11', farmId: 'farm-2', financialYear: '2024-25', category: 'labour', budgetedAUD: 25000 },
  { id: 'b-12', farmId: 'farm-2', financialYear: '2024-25', category: 'insurance', budgetedAUD: 17000 },
];

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventory: InventoryItem[] = [
  // Farm 1
  { id: 'i-1', farmId: 'farm-1', name: 'Glyphosate 450', category: 'chemical', unit: 'L', quantity: 840, minStockLevel: 200, location: 'Chemical shed', supplier: 'Landmark', costPerUnit: 3.2, expiryDate: '2027-01-01' },
  { id: 'i-2', farmId: 'farm-1', name: 'Urea 46%', category: 'fertiliser', unit: 'tonne', quantity: 48, minStockLevel: 10, location: 'Fertiliser bay', supplier: 'Incitec Pivot', costPerUnit: 680 },
  { id: 'i-3', farmId: 'farm-1', name: 'Wheat Seed – Sunguard', category: 'seed', unit: 'tonne', quantity: 8.5, minStockLevel: 0, location: 'Seed shed', costPerUnit: 750 },
  { id: 'i-4', farmId: 'farm-1', name: 'Diesel', category: 'fuel', unit: 'L', quantity: 12000, minStockLevel: 3000, location: 'Main tank', costPerUnit: 1.72 },
  { id: 'i-5', farmId: 'farm-1', name: 'Petrol', category: 'fuel', unit: 'L', quantity: 600, minStockLevel: 200, location: 'Petrol drum', costPerUnit: 1.98 },
  { id: 'i-6', farmId: 'farm-1', name: 'Lucerne Hay', category: 'feed', unit: 'bale', quantity: 180, minStockLevel: 50, location: 'Hay shed', costPerUnit: 28 },
  { id: 'i-7', farmId: 'farm-1', name: 'Cereal Hay', category: 'feed', unit: 'bale', quantity: 320, minStockLevel: 80, location: 'Hay shed', costPerUnit: 18 },
  { id: 'i-8', farmId: 'farm-1', name: 'Sheep Drench – Trichlamox', category: 'chemical', unit: 'L', quantity: 12, minStockLevel: 4, location: 'Vet shed', supplier: 'Hillston Vet', costPerUnit: 45, expiryDate: '2026-06-01' },
  // Farm 2
  { id: 'i-9',  farmId: 'farm-2', name: 'Roundup PowerMax', category: 'chemical', unit: 'L', quantity: 220, minStockLevel: 50, location: 'Chem shed', supplier: 'Landmark Horsham', costPerUnit: 4.8, expiryDate: '2027-03-01' },
  { id: 'i-10', farmId: 'farm-2', name: 'Diesel', category: 'fuel', unit: 'L', quantity: 4500, minStockLevel: 1000, location: 'Farm tank', costPerUnit: 1.74 },
  { id: 'i-11', farmId: 'farm-2', name: 'Oaten Hay', category: 'feed', unit: 'bale', quantity: 95, minStockLevel: 40, location: 'Hay shed', costPerUnit: 16 },
  { id: 'i-12', farmId: 'farm-2', name: 'Lamb Drench – Levacare', category: 'chemical', unit: 'L', quantity: 8, minStockLevel: 3, location: 'Vet room', supplier: 'Wimmera Vet', costPerUnit: 38, expiryDate: '2026-12-01' },
  { id: 'i-13', farmId: 'farm-2', name: 'Ammonium Nitrate', category: 'fertiliser', unit: 'tonne', quantity: 12, minStockLevel: 5, location: 'Fertiliser pad', supplier: 'Incitec Pivot', costPerUnit: 720 },
  { id: 'i-14', farmId: 'farm-2', name: 'Mineral Lick Blocks', category: 'feed', unit: 'unit', quantity: 60, minStockLevel: 20, location: 'Stockroom', costPerUnit: 22 },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasks: Task[] = [
  // Farm 1
  { id: 'tk-1', farmId: 'farm-1', title: 'Service header before harvest', status: 'todo', priority: 'critical', dueDate: '2025-08-15', equipmentId: 'eq-2', category: 'machinery', assignedTo: 'James Mackenzie' },
  { id: 'tk-2', farmId: 'farm-1', title: 'Blood test mob – Angus Breeders', status: 'todo', priority: 'high', dueDate: '2025-07-01', paddockId: 'p-3', category: 'livestock', assignedTo: 'Sarah Collins' },
  { id: 'tk-3', farmId: 'farm-1', title: 'Apply fungicide – North Flat wheat', status: 'in_progress', priority: 'high', dueDate: '2025-06-28', paddockId: 'p-1', category: 'crops', assignedTo: 'Tom Walsh' },
  { id: 'tk-4', farmId: 'farm-1', title: 'Repair MF7726 hydraulic pump', status: 'in_progress', priority: 'high', dueDate: '2025-06-30', equipmentId: 'eq-4', category: 'machinery', assignedTo: 'James Mackenzie' },
  { id: 'tk-5', farmId: 'farm-1', title: 'Weed inspection – Eastern Rise', status: 'todo', priority: 'medium', dueDate: '2025-07-05', paddockId: 'p-3', category: 'crops' },
  { id: 'tk-6', farmId: 'farm-1', title: 'Order diesel – 10,000L', status: 'done', priority: 'medium', dueDate: '2025-06-20', completedDate: '2025-06-19', category: 'inventory', assignedTo: 'James Mackenzie' },
  { id: 'tk-7', farmId: 'farm-1', title: 'Submit BAS Q4 2024-25', status: 'todo', priority: 'high', dueDate: '2025-07-28', category: 'finance', assignedTo: 'Mary OʼBrien' },
  { id: 'tk-8', farmId: 'farm-1', title: 'Centre pivot inspection – House Paddock', status: 'todo', priority: 'medium', dueDate: '2025-07-15', paddockId: 'p-4', category: 'irrigation', equipmentId: 'eq-6' },
  { id: 'tk-9', farmId: 'farm-1', title: 'Update NLIS database – steer movement', status: 'overdue', priority: 'high', dueDate: '2025-06-15', category: 'livestock', assignedTo: 'James Mackenzie', notes: 'Regulatory requirement – must complete ASAP' },
  // Farm 2
  { id: 'tk-10', farmId: 'farm-2', title: 'Lamb drafting – Creek Flats', status: 'todo', priority: 'high', dueDate: '2025-07-05', paddockId: 'rg-1', category: 'livestock', assignedTo: 'Sarah Thornton' },
  { id: 'tk-11', farmId: 'farm-2', title: 'Check water troughs – all paddocks', status: 'todo', priority: 'medium', dueDate: '2025-07-02', category: 'livestock', assignedTo: 'Sarah Thornton' },
  { id: 'tk-12', farmId: 'farm-2', title: 'Renew Biosecurity Plan', status: 'overdue', priority: 'high', dueDate: '2025-06-01', category: 'compliance', assignedTo: 'Sarah Thornton', notes: 'VIC DPI requirement' },
  { id: 'tk-13', farmId: 'farm-2', title: 'K-Line irrigation service', status: 'todo', priority: 'medium', dueDate: '2025-07-15', paddockId: 'rg-1', category: 'irrigation', equipmentId: 'eq-10' },
  { id: 'tk-14', farmId: 'farm-2', title: 'Submit BAS Q4 2024-25', status: 'todo', priority: 'high', dueDate: '2025-07-28', category: 'finance' },
  { id: 'tk-15', farmId: 'farm-2', title: 'Pasture assessment – Hill Country', status: 'in_progress', priority: 'medium', dueDate: '2025-07-10', paddockId: 'rg-4', category: 'crops', assignedTo: 'Sarah Thornton' },
];

// ─── Weather ──────────────────────────────────────────────────────────────────

export const weatherReadings: WeatherReading[] = [
  { date: '2025-06-23', tempMaxC: 14, tempMinC: 3, rainfallMm: 8.2, humidityPct: 78, windKph: 22, evapMm: 1.2 },
  { date: '2025-06-24', tempMaxC: 12, tempMinC: 2, rainfallMm: 0, humidityPct: 65, windKph: 18, evapMm: 1.5 },
  { date: '2025-06-25', tempMaxC: 15, tempMinC: 4, rainfallMm: 2.4, humidityPct: 72, windKph: 12, evapMm: 1.8 },
  { date: '2025-06-26', tempMaxC: 17, tempMinC: 5, rainfallMm: 0, humidityPct: 60, windKph: 15, evapMm: 2.1 },
  { date: '2025-06-27', tempMaxC: 16, tempMinC: 4, rainfallMm: 12.6, humidityPct: 85, windKph: 25, evapMm: 0.8 },
  { date: '2025-06-28', tempMaxC: 13, tempMinC: 3, rainfallMm: 3.8, humidityPct: 82, windKph: 20, evapMm: 1.0 },
  { date: '2025-06-29', tempMaxC: 14, tempMinC: 4, rainfallMm: 0, humidityPct: 70, windKph: 16, evapMm: 1.6 },
];

export const rainfallSummary: RainfallSummary[] = [
  { month: 'Jul 2024', rainfallMm: 28, avgRainfallMm: 32 },
  { month: 'Aug 2024', rainfallMm: 35, avgRainfallMm: 30 },
  { month: 'Sep 2024', rainfallMm: 22, avgRainfallMm: 28 },
  { month: 'Oct 2024', rainfallMm: 44, avgRainfallMm: 38 },
  { month: 'Nov 2024', rainfallMm: 18, avgRainfallMm: 35 },
  { month: 'Dec 2024', rainfallMm: 12, avgRainfallMm: 25 },
  { month: 'Jan 2025', rainfallMm: 8, avgRainfallMm: 22 },
  { month: 'Feb 2025', rainfallMm: 24, avgRainfallMm: 28 },
  { month: 'Mar 2025', rainfallMm: 38, avgRainfallMm: 32 },
  { month: 'Apr 2025', rainfallMm: 52, avgRainfallMm: 40 },
  { month: 'May 2025', rainfallMm: 41, avgRainfallMm: 38 },
  { month: 'Jun 2025', rainfallMm: 27, avgRainfallMm: 35 },
];

// ─── Users ────────────────────────────────────────────────────────────────────

export const users: User[] = [
  // Farm 1
  { id: 'u-1', farmId: 'farm-1', name: 'James Mackenzie', email: 'james@riverdale.com.au', role: 'owner', phone: '0427 123 456', active: true, lastLogin: '2025-06-29' },
  { id: 'u-2', farmId: 'farm-1', name: 'Sarah Collins', email: 'sarah@riverdale.com.au', role: 'manager', phone: '0412 234 567', active: true, lastLogin: '2025-06-28' },
  { id: 'u-3', farmId: 'farm-1', name: 'Tom Walsh', email: 'tom@riverdale.com.au', role: 'operator', phone: '0438 345 678', active: true, lastLogin: '2025-06-27' },
  { id: 'u-4', farmId: 'farm-1', name: 'Mary O\'Brien', email: 'mary@accounts.com.au', role: 'accountant', phone: '02 6967 1234', active: true, lastLogin: '2025-06-25' },
  { id: 'u-5', farmId: 'farm-1', name: 'Dr. Pete Nguyen', email: 'pete@hillstonvet.com.au', role: 'agronomist', active: false, lastLogin: '2025-05-14' },
  // Farm 2
  { id: 'u-6', farmId: 'farm-2', name: 'Sarah Thornton', email: 'sarah@redgumgrazing.com.au', role: 'owner', phone: '0417 555 001', active: true, lastLogin: '2025-06-29' },
  { id: 'u-7', farmId: 'farm-2', name: 'Ben Thornton', email: 'ben@redgumgrazing.com.au', role: 'manager', phone: '0417 555 002', active: true, lastLogin: '2025-06-28' },
  { id: 'u-8', farmId: 'farm-2', name: 'Grace Olsson', email: 'grace@wimmera-accounts.com.au', role: 'accountant', phone: '03 5382 1234', active: true, lastLogin: '2025-06-20' },
];

// ─── Fence Lines ──────────────────────────────────────────────────────────────

export const fenceLines: FenceLine[] = [
  {
    id: 'fl-1', farmId: 'farm-1', name: 'North Boundary',
    color: '#78350f',
    points: [[-33.475, 145.495], [-33.475, 145.520], [-33.478, 145.540]],
  },
  {
    id: 'fl-2', farmId: 'farm-1', name: 'Creek Boundary',
    color: '#1e3a5f',
    points: [[-33.490, 145.510], [-33.497, 145.515], [-33.503, 145.512]],
  },
  {
    id: 'fl-3', farmId: 'farm-2', name: 'Eastern Fence',
    color: '#78350f',
    points: [[-36.705, 142.010], [-36.715, 142.025], [-36.725, 142.020]],
  },
];

// ─── Map Features ─────────────────────────────────────────────────────────────

export const mapFeatures: MapFeature[] = [
  { id: 'mf-1', farmId: 'farm-1', type: 'shed',         name: 'Main Shed',     coordinates: [-33.489, 145.503] },
  { id: 'mf-2', farmId: 'farm-1', type: 'water_trough', name: 'North Trough',  coordinates: [-33.493, 145.513] },
  { id: 'mf-3', farmId: 'farm-1', type: 'water_trough', name: 'Bore Trough',   coordinates: [-33.507, 145.548] },
  { id: 'mf-4', farmId: 'farm-1', type: 'dam',          name: 'Main Dam',      coordinates: [-33.501, 145.540] },
  { id: 'mf-5', farmId: 'farm-1', type: 'gate',         name: 'Front Gate',    coordinates: [-33.485, 145.498] },
  { id: 'mf-6', farmId: 'farm-2', type: 'shed',         name: 'Machinery Shed',coordinates: [-36.712, 142.012] },
  { id: 'mf-7', farmId: 'farm-2', type: 'dam',          name: 'Stock Dam',     coordinates: [-36.720, 142.030] },
];
