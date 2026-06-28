import { ApiError } from '../utils/ApiError.js';

/**
 * Valida req[part] con un esquema Zod y reemplaza con el valor parseado.
 * Uso: router.get('/', validate(schema, 'query'), controller)
 */
export const validate = (schema, part = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[part]);
  if (!result.success) {
    return next(
      ApiError.badRequest('Datos de entrada inválidos', result.error.flatten()),
    );
  }
  req[part] = result.data;
  next();
};
