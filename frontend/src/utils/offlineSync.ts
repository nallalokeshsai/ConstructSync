import api from '../services/api';

const OFFLINE_KEY = 'constructsync_offline_indents';

export interface OfflineIndent {
  tempId: string;
  projectId: string;
  projectName?: string;
  priority: string;
  requiredDate?: string;
  notes?: string;
  items: {
    materialName: string;
    materialCategory?: string;
    quantity: number;
    unit: string;
    estimatedRate?: number;
    notes?: string;
  }[];
  createdAt: string;
}

export function saveOfflineIndent(indent: Omit<OfflineIndent, 'tempId' | 'createdAt'>): OfflineIndent {
  const existing = getOfflineIndents();
  const newRecord: OfflineIndent = {
    ...indent,
    tempId: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
  };
  existing.push(newRecord);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(existing));
  return newRecord;
}

export function getOfflineIndents(): OfflineIndent[] {
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function clearOfflineIndents() {
  localStorage.removeItem(OFFLINE_KEY);
}

export async function syncOfflineIndents(): Promise<{ success: boolean; count: number }> {
  const indents = getOfflineIndents();
  if (indents.length === 0) return { success: true, count: 0 };

  try {
    const res = await api.post('/indents/batch-sync', { indents });
    clearOfflineIndents();
    return { success: true, count: res.data.syncedCount };
  } catch (error) {
    console.error('Offline sync failed:', error);
    return { success: false, count: 0 };
  }
}
