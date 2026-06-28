import { categoryRepository } from './category.repository.js';
import { toCategoryDTO } from './category.model.js';
import { toPageSummary } from '../page/page.model.js';

/** Service: reglas de negocio de Category. Sin HTTP ni Firestore directo. */
export const categoryService = {
  async list() {
    const docs = await categoryRepository.list();
    return docs.map(toCategoryDTO);
  },

  async pagesOf(name, limit = 50) {
    const catDoc = await categoryRepository.findByName(name);
    const pages = await categoryRepository.pagesOf(name, limit);
    return {
      category: catDoc ? toCategoryDTO(catDoc) : { name, count: null },
      pages: pages.map(toPageSummary),
    };
  },
};
