import { useMemo } from 'react';
import { useFarmData } from './useFarmData';
import { daysUntil } from '../lib/utils';

export type NotifPriority = 'critical' | 'high' | 'medium' | 'info';
export type NotifType = 'task' | 'inventory' | 'equipment';

export interface FarmNotification {
  id: string;
  priority: NotifPriority;
  type: NotifType;
  message: string;
  detail?: string;
}

const PRIORITY_ORDER: Record<NotifPriority, number> = {
  critical: 0, high: 1, medium: 2, info: 3,
};

/**
 * Derives live alerts from the active farm's data:
 * - Overdue / due-soon tasks
 * - Low / zero stock inventory items
 * - Equipment with overdue or upcoming service
 */
export function useNotifications() {
  const { tasks, inventory, equipment } = useFarmData();

  return useMemo(() => {
    const alerts: FarmNotification[] = [];

    // ── Tasks ──────────────────────────────────────────────────────────────
    for (const t of tasks) {
      if (t.status === 'done' || !t.dueDate) continue;
      const days = daysUntil(t.dueDate);

      if (days < 0) {
        alerts.push({
          id:       `task-overdue-${t.id}`,
          priority: t.priority === 'critical' ? 'critical' : 'high',
          type:     'task',
          message:  `Task overdue`,
          detail:   t.title,
        });
      } else if (days <= 3) {
        alerts.push({
          id:       `task-due-${t.id}`,
          priority: days === 0 ? 'high' : 'medium',
          type:     'task',
          message:  days === 0 ? 'Due today' : `Due in ${days} day${days > 1 ? 's' : ''}`,
          detail:   t.title,
        });
      }
    }

    // ── Inventory ──────────────────────────────────────────────────────────
    for (const i of inventory) {
      if (i.minStockLevel === undefined) continue;
      if (i.quantity <= i.minStockLevel) {
        alerts.push({
          id:       `inv-low-${i.id}`,
          priority: i.quantity === 0 ? 'high' : 'medium',
          type:     'inventory',
          message:  i.quantity === 0 ? 'Out of stock' : 'Low stock',
          detail:   `${i.name} — ${i.quantity} ${i.unit} remaining`,
        });
      }
    }

    // ── Equipment ──────────────────────────────────────────────────────────
    for (const e of equipment) {
      if (!e.nextServiceDate) continue;
      const days = daysUntil(e.nextServiceDate);
      if (days <= 7) {
        alerts.push({
          id:       `equip-svc-${e.id}`,
          priority: days < 0 ? 'high' : 'medium',
          type:     'equipment',
          message:  days < 0 ? 'Service overdue' : `Service in ${days} day${days !== 1 ? 's' : ''}`,
          detail:   e.name,
        });
      }
    }

    // Sort critical → high → medium → info
    alerts.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

    return { alerts, count: alerts.length };
  }, [tasks, inventory, equipment]);
}
