import { create } from 'zustand';
import type {
  Farm, Paddock, LivestockAnimal, LivestockMobGroup, CropRecord, SprayRecord,
  Equipment, MaintenanceLog, Transaction, Budget, InventoryItem, Task, User,
  TaskStatus,
} from '../types';
import { supabase } from '../lib/supabase';
import { jsToDb, mapRows, dbToJs } from '../lib/db';
import { useAppStore } from './appStore';

/** Generate a standard UUID for new records. */
function uid(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface DataStore {
  // ── State ────────────────────────────────────────────────────────────────
  farms: Farm[];
  paddocks: Paddock[];
  livestockMobs: LivestockMobGroup[];
  livestock: LivestockAnimal[];
  crops: CropRecord[];
  sprayRecords: SprayRecord[];
  equipment: Equipment[];
  maintenanceLogs: MaintenanceLog[];
  transactions: Transaction[];
  budgets: Budget[];
  inventory: InventoryItem[];
  tasks: Task[];
  users: User[];
  /** True while the initial Supabase data load is running. */
  dataLoading: boolean;

  // ── Bootstrap ────────────────────────────────────────────────────────────
  loadFromSupabase: (userId: string) => Promise<void>;
  clearData: () => void;
  subscribeToRealtime: (farmIds: string[]) => () => void;

  // ── Farms ────────────────────────────────────────────────────────────────
  addFarm: (userId: string, data: Omit<Farm, 'id' | 'createdAt'>) => Promise<Farm>;

  // ── Paddocks ─────────────────────────────────────────────────────────────
  addPaddock: (farmId: string, data: Omit<Paddock, 'id' | 'farmId'>) => Paddock;
  deletePaddock: (id: string) => void;

  // ── Livestock ─────────────────────────────────────────────────────────────
  addLivestockMob: (farmId: string, data: Omit<LivestockMobGroup, 'id' | 'farmId'>) => LivestockMobGroup;
  addLivestockAnimal: (farmId: string, data: Omit<LivestockAnimal, 'id' | 'farmId'>) => LivestockAnimal;
  deleteLivestockMob: (id: string) => void;
  deleteLivestockAnimal: (id: string) => void;

  // ── Tasks ─────────────────────────────────────────────────────────────────
  addTask: (farmId: string, data: Omit<Task, 'id' | 'farmId'>) => Task;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;

  // ── Transactions ──────────────────────────────────────────────────────────
  addTransaction: (farmId: string, data: Omit<Transaction, 'id' | 'farmId'>) => Transaction;
  deleteTransaction: (id: string) => void;

  // ── Inventory ─────────────────────────────────────────────────────────────
  addInventoryItem: (farmId: string, data: Omit<InventoryItem, 'id' | 'farmId'>) => InventoryItem;
  updateInventoryQty: (id: string, quantity: number) => void;
  deleteInventoryItem: (id: string) => void;

  // ── Equipment ─────────────────────────────────────────────────────────────
  addEquipment: (farmId: string, data: Omit<Equipment, 'id' | 'farmId'>) => Equipment;
  deleteEquipment: (id: string) => void;
}

const EMPTY: Omit<DataStore,
  'loadFromSupabase' | 'clearData' | 'subscribeToRealtime' | 'addFarm' |
  'addPaddock' | 'deletePaddock' | 'addLivestockMob' | 'addLivestockAnimal' |
  'deleteLivestockMob' | 'deleteLivestockAnimal' | 'addTask' | 'updateTaskStatus' |
  'deleteTask' | 'addTransaction' | 'deleteTransaction' | 'addInventoryItem' |
  'updateInventoryQty' | 'deleteInventoryItem' | 'addEquipment' | 'deleteEquipment'
> = {
  farms: [], paddocks: [], livestockMobs: [], livestock: [], crops: [],
  sprayRecords: [], equipment: [], maintenanceLogs: [], transactions: [],
  budgets: [], inventory: [], tasks: [], users: [], dataLoading: false,
};

export const useDataStore = create<DataStore>()((set) => ({
  ...EMPTY,

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  loadFromSupabase: async (userId: string) => {
    set({ dataLoading: true });
    try {
      const { data: farmsRaw, error: farmsErr } = await supabase
        .from('farms').select('*').eq('user_id', userId);
      if (farmsErr) throw farmsErr;

      const farms = mapRows<Farm>(farmsRaw);
      if (farms.length === 0) { set({ farms, dataLoading: false }); return; }

      const farmIds = farms.map((f) => f.id);

      const [
        paddocksRes, mobsRes, livestockRes, cropsRes, sprayRes,
        equipRes, txRes, budgetRes, invRes, tasksRes, usersRes,
      ] = await Promise.all([
        supabase.from('paddocks').select('*').in('farm_id', farmIds),
        supabase.from('livestock_mobs').select('*').in('farm_id', farmIds),
        supabase.from('livestock_animals').select('*').in('farm_id', farmIds),
        supabase.from('crops').select('*').in('farm_id', farmIds),
        supabase.from('spray_records').select('*').in('farm_id', farmIds),
        supabase.from('equipment').select('*').in('farm_id', farmIds),
        supabase.from('transactions').select('*').in('farm_id', farmIds),
        supabase.from('budgets').select('*').in('farm_id', farmIds),
        supabase.from('inventory').select('*').in('farm_id', farmIds),
        supabase.from('tasks').select('*').in('farm_id', farmIds),
        supabase.from('farm_users').select('*').in('farm_id', farmIds),
      ]);

      const farmEquipment = mapRows<Equipment>(equipRes.data);
      const equipmentIds = farmEquipment.map((e) => e.id);
      const maintenanceRes = equipmentIds.length
        ? await supabase.from('maintenance_logs').select('*').in('equipment_id', equipmentIds)
        : { data: [] };

      // Keep activeFarmId pointing at a valid farm for this user
      const currentActive = useAppStore.getState().activeFarmId;
      if (!currentActive || !farmIds.includes(currentActive))
        useAppStore.getState().setActiveFarm(farmIds[0]);

      set({
        farms,
        paddocks:        mapRows<Paddock>(paddocksRes.data),
        livestockMobs:   mapRows<LivestockMobGroup>(mobsRes.data),
        livestock:       mapRows<LivestockAnimal>(livestockRes.data),
        crops:           mapRows<CropRecord>(cropsRes.data),
        sprayRecords:    mapRows<SprayRecord>(sprayRes.data),
        equipment:       farmEquipment,
        maintenanceLogs: mapRows<MaintenanceLog>(maintenanceRes.data),
        transactions:    mapRows<Transaction>(txRes.data),
        budgets:         mapRows<Budget>(budgetRes.data),
        inventory:       mapRows<InventoryItem>(invRes.data),
        tasks:           mapRows<Task>(tasksRes.data),
        users:           mapRows<User>(usersRes.data),
        dataLoading: false,
      });
    } catch (err) {
      console.error('[dataStore] loadFromSupabase failed:', err);
      set({ dataLoading: false });
    }
  },

  clearData: () => set(EMPTY),

  subscribeToRealtime: (farmIds: string[]) => {
    const ch = supabase.channel('farmmap-realtime')
      // Paddocks
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'paddocks' }, (p) => {
        const row = dbToJs<Paddock>(p.new as Record<string, unknown>);
        if (farmIds.includes(row.farmId))
          set((s) => ({ paddocks: [...s.paddocks.filter((x) => x.id !== row.id), row] }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'paddocks' }, (p) => {
        const row = dbToJs<Paddock>(p.new as Record<string, unknown>);
        set((s) => ({ paddocks: s.paddocks.map((x) => x.id === row.id ? row : x) }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'paddocks' }, (p) => {
        const id = (p.old as { id: string }).id;
        set((s) => ({ paddocks: s.paddocks.filter((x) => x.id !== id) }));
      })
      // Tasks
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (p) => {
        const row = dbToJs<Task>(p.new as Record<string, unknown>);
        if (farmIds.includes(row.farmId))
          set((s) => ({ tasks: [...s.tasks.filter((x) => x.id !== row.id), row] }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (p) => {
        const row = dbToJs<Task>(p.new as Record<string, unknown>);
        set((s) => ({ tasks: s.tasks.map((x) => x.id === row.id ? row : x) }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, (p) => {
        const id = (p.old as { id: string }).id;
        set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) }));
      })
      // Transactions
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (p) => {
        const row = dbToJs<Transaction>(p.new as Record<string, unknown>);
        if (farmIds.includes(row.farmId))
          set((s) => ({ transactions: [row, ...s.transactions.filter((x) => x.id !== row.id)] }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions' }, (p) => {
        const id = (p.old as { id: string }).id;
        set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) }));
      })
      // Inventory
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inventory' }, (p) => {
        const row = dbToJs<InventoryItem>(p.new as Record<string, unknown>);
        if (farmIds.includes(row.farmId))
          set((s) => ({ inventory: [...s.inventory.filter((x) => x.id !== row.id), row] }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inventory' }, (p) => {
        const row = dbToJs<InventoryItem>(p.new as Record<string, unknown>);
        set((s) => ({ inventory: s.inventory.map((x) => x.id === row.id ? row : x) }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'inventory' }, (p) => {
        const id = (p.old as { id: string }).id;
        set((s) => ({ inventory: s.inventory.filter((x) => x.id !== id) }));
      })
      // Livestock mobs
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'livestock_mobs' }, (p) => {
        const row = dbToJs<LivestockMobGroup>(p.new as Record<string, unknown>);
        if (farmIds.includes(row.farmId))
          set((s) => ({ livestockMobs: [...s.livestockMobs.filter((x) => x.id !== row.id), row] }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'livestock_mobs' }, (p) => {
        const id = (p.old as { id: string }).id;
        set((s) => ({ livestockMobs: s.livestockMobs.filter((x) => x.id !== id) }));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  },

  // ── Farms ─────────────────────────────────────────────────────────────────

  addFarm: async (userId, data) => {
    const record: Farm = { ...data, id: uid(), createdAt: new Date().toISOString().slice(0, 10) };
    const dbRow = { ...jsToDb(record as unknown as Record<string, unknown>), user_id: userId };
    const { error } = await supabase.from('farms').insert(dbRow);
    if (error) throw new Error(error.message);
    set((s) => ({ farms: [...s.farms, record] }));
    useAppStore.getState().setActiveFarm(record.id);
    return record;
  },

  // ── Paddocks ──────────────────────────────────────────────────────────────

  addPaddock: (farmId, data) => {
    const record: Paddock = { ...data, id: uid(), farmId };
    set((s) => ({ paddocks: [...s.paddocks, record] }));
    supabase.from('paddocks').insert(jsToDb(record as unknown as Record<string, unknown>))
      .then(({ error }) => { if (error) console.error('[DB] addPaddock:', error.message); });
    return record;
  },
  deletePaddock: (id) => {
    set((s) => ({ paddocks: s.paddocks.filter((p) => p.id !== id) }));
    supabase.from('paddocks').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[DB] deletePaddock:', error.message); });
  },

  // ── Livestock ─────────────────────────────────────────────────────────────

  addLivestockMob: (farmId, data) => {
    const record: LivestockMobGroup = { ...data, id: uid(), farmId };
    set((s) => ({ livestockMobs: [...s.livestockMobs, record] }));
    supabase.from('livestock_mobs').insert(jsToDb(record as unknown as Record<string, unknown>))
      .then(({ error }) => { if (error) console.error('[DB] addLivestockMob:', error.message); });
    return record;
  },
  addLivestockAnimal: (farmId, data) => {
    const record: LivestockAnimal = { ...data, id: uid(), farmId };
    set((s) => ({ livestock: [...s.livestock, record] }));
    supabase.from('livestock_animals').insert(jsToDb(record as unknown as Record<string, unknown>))
      .then(({ error }) => { if (error) console.error('[DB] addLivestockAnimal:', error.message); });
    return record;
  },
  deleteLivestockMob: (id) => {
    set((s) => ({ livestockMobs: s.livestockMobs.filter((m) => m.id !== id) }));
    supabase.from('livestock_mobs').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[DB] deleteLivestockMob:', error.message); });
  },
  deleteLivestockAnimal: (id) => {
    set((s) => ({ livestock: s.livestock.filter((l) => l.id !== id) }));
    supabase.from('livestock_animals').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[DB] deleteLivestockAnimal:', error.message); });
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────

  addTask: (farmId, data) => {
    const record: Task = { ...data, id: uid(), farmId };
    set((s) => ({ tasks: [...s.tasks, record] }));
    supabase.from('tasks').insert(jsToDb(record as unknown as Record<string, unknown>))
      .then(({ error }) => { if (error) console.error('[DB] addTask:', error.message); });
    return record;
  },
  updateTaskStatus: (id, status) => {
    const completedDate = status === 'done' ? new Date().toISOString().slice(0, 10) : undefined;
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status, ...(completedDate ? { completedDate } : {}) } : t
      ),
    }));
    supabase.from('tasks')
      .update(jsToDb({ status, completedDate } as unknown as Record<string, unknown>))
      .eq('id', id)
      .then(({ error }) => { if (error) console.error('[DB] updateTaskStatus:', error.message); });
  },
  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    supabase.from('tasks').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[DB] deleteTask:', error.message); });
  },

  // ── Transactions ──────────────────────────────────────────────────────────

  addTransaction: (farmId, data) => {
    const record: Transaction = { ...data, id: uid(), farmId };
    set((s) => ({ transactions: [record, ...s.transactions] }));
    supabase.from('transactions').insert(jsToDb(record as unknown as Record<string, unknown>))
      .then(({ error }) => { if (error) console.error('[DB] addTransaction:', error.message); });
    return record;
  },
  deleteTransaction: (id) => {
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    supabase.from('transactions').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[DB] deleteTransaction:', error.message); });
  },

  // ── Inventory ─────────────────────────────────────────────────────────────

  addInventoryItem: (farmId, data) => {
    const record: InventoryItem = { ...data, id: uid(), farmId };
    set((s) => ({ inventory: [...s.inventory, record] }));
    supabase.from('inventory').insert(jsToDb(record as unknown as Record<string, unknown>))
      .then(({ error }) => { if (error) console.error('[DB] addInventoryItem:', error.message); });
    return record;
  },
  updateInventoryQty: (id, quantity) => {
    set((s) => ({ inventory: s.inventory.map((i) => i.id === id ? { ...i, quantity } : i) }));
    supabase.from('inventory').update({ quantity }).eq('id', id)
      .then(({ error }) => { if (error) console.error('[DB] updateInventoryQty:', error.message); });
  },
  deleteInventoryItem: (id) => {
    set((s) => ({ inventory: s.inventory.filter((i) => i.id !== id) }));
    supabase.from('inventory').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[DB] deleteInventoryItem:', error.message); });
  },

  // ── Equipment ─────────────────────────────────────────────────────────────

  addEquipment: (farmId, data) => {
    const record: Equipment = { ...data, id: uid(), farmId };
    set((s) => ({ equipment: [...s.equipment, record] }));
    supabase.from('equipment').insert(jsToDb(record as unknown as Record<string, unknown>))
      .then(({ error }) => { if (error) console.error('[DB] addEquipment:', error.message); });
    return record;
  },
  deleteEquipment: (id) => {
    set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) }));
    supabase.from('equipment').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[DB] deleteEquipment:', error.message); });
  },
}));
