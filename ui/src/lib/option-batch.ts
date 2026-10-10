export type PendingOption = { name: string; requestId: string };

export function optionBatch(
  names: string,
  previous: PendingOption[],
  newId: () => string,
): PendingOption[] {
  return [
    ...new Set(
      names
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ].map(
    (name) =>
      previous.find((entry) => entry.name === name) ?? {
        name,
        requestId: newId(),
      },
  );
}

/** Conserva la clave incluso si el servidor guardó una opción y se perdió la respuesta. */
export async function saveOptionBatch(
  entries: PendingOption[],
  save: (entry: PendingOption) => Promise<unknown>,
  onProgress: (completed: number) => void,
) {
  for (const [index, entry] of entries.entries()) {
    try {
      await save(entry);
      onProgress(index + 1);
    } catch (error) {
      return { completed: index, pending: entries.slice(index), error };
    }
  }
  return {
    completed: entries.length,
    pending: [] as PendingOption[],
    error: null,
  };
}
