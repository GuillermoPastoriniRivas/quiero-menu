export class SearchTerm {
  constructor(
    public readonly id: string,
    /** Término normalizado (minúsculas, sin acentos). */
    public readonly term: string,
    public readonly count: number,
    /** Veces que la búsqueda no devolvió resultados: demanda insatisfecha. */
    public readonly zeroResults: number,
    public readonly lastAt: Date,
  ) {}
}
