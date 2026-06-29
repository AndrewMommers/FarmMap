import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SearchBar } from '../components/ui/SearchBar';
import { StatCard } from '../components/ui/StatCard';
import { AddTaskModal } from '../components/modals/AddTaskModal';
import { useFarmData } from '../hooks/useFarmData';
import { useDataStore } from '../store/dataStore';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, CheckCircle2, Clock, AlertTriangle, ListChecks } from 'lucide-react';
import type { TaskPriority } from '../types';

const PRIORITY_ORDER: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

export function TasksPage() {
  const { tasks, paddocks, equipment } = useFarmData();
  const updateTaskStatus = useDataStore((s) => s.updateTaskStatus);
  const [search, setSearch] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => t.status === 'overdue').length;

  const filtered = tasks
    .filter(t => {
      const q = t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.assignedTo ?? '').toLowerCase().includes(search.toLowerCase());
      const s = statusFilter === 'all' || t.status === statusFilter;
      const p = priorityFilter === 'all' || t.priority === priorityFilter;
      return q && s && p;
    })
    .sort((a, b) => {
      const pi = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
      if (pi !== 0) return pi;
      return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
    });

  const getPaddock = (id?: string) => paddocks.find(p => p.id === id)?.name;
  const getEquipment = (id?: string) => equipment.find(e => e.id === id)?.name;

  const markDone = (id: string) => {
    updateTaskStatus(id, 'done');
    toast.success('Task marked complete!');
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-farm-500" />;
    if (status === 'overdue') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (status === 'in_progress') return <Clock className="w-4 h-4 text-blue-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <AddTaskModal open={showAddTask} onClose={() => setShowAddTask(false)} />
      <PageHeader
        title="Tasks & Work Orders"
        subtitle="Farm task management and work scheduling"
        actions={
          <button className="btn-primary" onClick={() => setShowAddTask(true)}>
            <Plus className="w-4 h-4" /> New Task
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="To Do" value={todo} icon={<ListChecks className="w-5 h-5" />} color="blue" />
        <StatCard title="In Progress" value={inProgress} icon={<Clock className="w-5 h-5" />} color="amber" />
        <StatCard title="Overdue" value={overdue} icon={<AlertTriangle className="w-5 h-5" />} color={overdue > 0 ? 'red' : 'green'} />
        <StatCard title="Completed" value={done} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {(['all', 'todo', 'in_progress', 'overdue', 'done'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${statusFilter === s ? 'bg-farm-700 text-white border-farm-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-farm-300'}`}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
        <div className="h-5 w-px bg-gray-200" />
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(p => (
          <button key={p} onClick={() => setPriorityFilter(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${priorityFilter === p ? 'bg-farm-700 text-white border-farm-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-farm-300'}`}>{p}</button>
        ))}
        <SearchBar value={search} onChange={setSearch} placeholder="Search tasks…" className="w-48 ml-auto" />
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {filtered.map(task => (
          <div key={task.id} className={`card flex items-start gap-4 ${task.status === 'overdue' ? 'border-red-200 bg-red-50/30' : task.status === 'done' ? 'opacity-60' : ''}`}>
            <button onClick={() => task.status !== 'done' && markDone(task.id)} className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform">
              <StatusIcon status={task.status} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`font-semibold text-gray-900 dark:text-gray-100 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                <StatusBadge status={task.priority} />
                <StatusBadge status={task.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                {task.dueDate && <span>Due: <strong className={task.status === 'overdue' ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}>{formatDate(task.dueDate)}</strong></span>}
                {task.assignedTo && <span>Assigned: <strong className="text-gray-600 dark:text-gray-300">{task.assignedTo}</strong></span>}
                {task.category && <span>Category: <strong className="text-gray-600 dark:text-gray-300 capitalize">{task.category}</strong></span>}
                {getPaddock(task.paddockId) && <span>Paddock: <strong className="text-gray-600 dark:text-gray-300">{getPaddock(task.paddockId)}</strong></span>}
                {getEquipment(task.equipmentId) && <span>Equipment: <strong className="text-gray-600 dark:text-gray-300">{getEquipment(task.equipmentId)}</strong></span>}
              </div>
              {task.notes && <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 inline-block">{task.notes}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {task.status !== 'done' && (
                <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => markDone(task.id)}>Done</button>
              )}
              <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => toast('Edit task – coming soon')}>Edit</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-12 text-gray-400">No tasks match your filters.</div>
        )}
      </div>
    </div>
  );
}
