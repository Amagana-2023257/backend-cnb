import { pageRepository } from './page.repository.js';
import { toPageDTO, toPageSummary } from './page.model.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Service: reglas de negocio de Page. No sabe de HTTP ni de Firestore.
 * - oculta spam salvo que se pida explícitamente,
 * - resuelve redirecciones (#REDIRECCIÓN).
 */
export const pageService = {
  async getBySlug(slug, { includeFlagged = false } = {}) {
    const doc = await pageRepository.findBySlug(slug);
    if (!doc) throw ApiError.notFound(`No existe el artículo "${slug}"`);

    const dto = toPageDTO(doc);
    if (dto.flagged && !includeFlagged) {
      throw ApiError.notFound('Artículo no disponible');
    }
    if (dto.redirectTo) {
      const target = await pageRepository.findBySlug(dto.redirectTo);
      if (target) return { ...toPageDTO(target), redirectedFrom: dto.slug };
    }
    return dto;
  },

  async list(opts) {
    const docs = await pageRepository.list(opts);
    return docs.map(toPageSummary);
  },
};
