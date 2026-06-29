import { useAppStore } from '../store/appStore';
import { useDataStore } from '../store/dataStore';
import { useWeatherHistory } from './useWeatherHistory';

/**
 * Returns all data filtered to the currently active farm.
 * Reads from the persisted dataStore so changes made via modals are reflected immediately.
 */
export function useFarmData() {
  const { activeFarmId } = useAppStore();
  const store = useDataStore();

  const farm = store.farms.find((f) => f.id === activeFarmId) ?? store.farms[0];
  const farmPaddocks = store.paddocks.filter((p) => p.farmId === activeFarmId);
  const firstCoords = farmPaddocks.find((p) => p.coordinates)?.coordinates;

  const { readings: weatherReadings, rainfallSummary, loading: weatherLoading } =
    useWeatherHistory(farm?.address, firstCoords);

  const farmEquipment = store.equipment.filter((e) => e.farmId === activeFarmId);
  const farmEquipmentIds = farmEquipment.map((e) => e.id);

  return {
    activeFarmId,
    farm,
    paddocks:        farmPaddocks,
    livestockMobs:   store.livestockMobs.filter((m) => m.farmId === activeFarmId),
    livestock:       store.livestock.filter((l) => l.farmId === activeFarmId),
    crops:           store.crops.filter((c) => c.farmId === activeFarmId),
    sprayRecords:    store.sprayRecords.filter((s) => s.farmId === activeFarmId),
    equipment:       farmEquipment,
    maintenanceLogs: store.maintenanceLogs.filter((ml) => farmEquipmentIds.includes(ml.equipmentId)),
    transactions:    store.transactions.filter((t) => t.farmId === activeFarmId),
    budgets:         store.budgets.filter((b) => b.farmId === activeFarmId),
    inventory:       store.inventory.filter((i) => i.farmId === activeFarmId),
    tasks:           store.tasks.filter((t) => t.farmId === activeFarmId),
    users:           store.users.filter((u) => u.farmId === activeFarmId),
    weatherReadings,
    rainfallSummary,
    weatherLoading,
  };
}
