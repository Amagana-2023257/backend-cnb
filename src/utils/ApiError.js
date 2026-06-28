/** Error de aplicación con código HTTP. Lo capta errorHandler. */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.expose = true;
  }
  static badRequest(msg, details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'No autenticado') { return new ApiError(401, msg); }
  static forbidden(msg = 'Sin permisos') { return new ApiError(403, msg); }
  static notFound(msg = 'No encontrado') { return new ApiError(404, msg); }
}
