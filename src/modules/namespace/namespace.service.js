import { namespaceRepository } from './namespace.repository.js';
import { toNamespaceDTO } from './namespace.model.js';
import { ApiError } from '../../utils/ApiError.js';

/** Service: reglas de negocio de Namespace. Sin HTTP ni Firestore directo. */
export const namespaceService = {
  async list() {
    const docs = await namespaceRepository.list();
    return docs.map(toNamespaceDTO);
  },

  async getById(id) {
    const doc = await namespaceRepository.findById(id);
    if (!doc) throw ApiError.notFound(`No existe el namespace ${id}`);
    return toNamespaceDTO(doc);
  },
};
