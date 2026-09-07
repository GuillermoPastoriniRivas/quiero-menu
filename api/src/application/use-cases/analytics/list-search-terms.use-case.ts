import { SearchTermRepository } from '../../../domain/repositories/search-term.repository.js';

/**
 * Términos más buscados en el directorio. Las búsquedas sin resultados son
 * la lista de demanda insatisfecha: qué local falta cargar o qué plato
 * nadie publica todavía. Solo para platform admin.
 */
export class ListSearchTermsUseCase {
  constructor(private readonly searchTermRepo: SearchTermRepository) {}

  async execute(limit = 50) {
    return this.searchTermRepo.listTop(limit);
  }
}
