export type ListDraft = {
  key: string;
  id?: string;
  name: string;
  description: string;
  basePrice: number;
  isAvailable: boolean;
  removed?: boolean;
  savedSignature?: string;
};
export const listPayload = (row: ListDraft) => ({ name: row.name.trim(), description: row.description.trim(), basePrice: row.basePrice, isAvailable: row.isAvailable });
export const listSignature = (row: ListDraft) => JSON.stringify(listPayload(row));

/** Checkpoint each confirmed operation before the next request, including new IDs. */
export async function saveListRows(
  initial: ListDraft[],
  operations: {
    create: (payload: ReturnType<typeof listPayload>) => Promise<{ id: string }>;
    update: (id: string, payload: ReturnType<typeof listPayload>) => Promise<void>;
    remove: (id: string) => Promise<void>;
  },
  checkpoint: (rows: ListDraft[]) => void,
): Promise<{ rows: ListDraft[]; failures: string[] }> {
  let rows = initial.map((row) => ({ ...row }));
  const failures: string[] = [];
  for (const row of initial) {
    try {
      if (row.removed) {
        if (row.id) await operations.remove(row.id);
        rows = rows.filter((r) => r.key !== row.key);
      } else {
        const signature = listSignature(row);
        if (row.id && row.savedSignature === signature) continue;
        const id = row.id ?? (await operations.create(listPayload(row))).id;
        if (row.id) await operations.update(id, listPayload(row));
        rows = rows.map((r) => r.key === row.key ? { ...r, id, savedSignature: signature } : r);
      }
      checkpoint(rows);
    } catch (cause) {
      failures.push(`${row.name || 'Opción nueva'}: ${cause instanceof Error ? cause.message : 'No se pudo guardar'}`);
    }
  }
  return { rows, failures };
}
