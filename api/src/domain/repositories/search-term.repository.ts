export interface SearchTermEntry {
  term: string;
  count: number;
  zeroResults: number;
  lastAt: Date;
}

export interface SearchTermRepository {
  /** Registra una búsqueda: con o sin resultados. Fire-and-forget friendly. */
  record(term: string, hadResults: boolean): Promise<void>;
  listTop(limit: number): Promise<SearchTermEntry[]>;
}
