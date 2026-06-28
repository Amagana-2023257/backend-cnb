/** Envuelve handlers async para enrutar los errores a errorHandler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
