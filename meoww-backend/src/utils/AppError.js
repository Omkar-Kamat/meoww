/**
 * AppError — the single error type thrown throughout the application.
 *
 * Benefits over ad-hoc `const err = new Error(); err.code = "..."`:
 *  - `instanceof AppError` lets the global handler distinguish operational
 *    errors (wrong password, expired OTP) from unexpected bugs (DB crash).
 *  - `statusCode` lives on the error itself — controllers don't need to
 *    decide what HTTP status maps to what error message.
 *  - `code` is a machine-readable string the frontend can switch on
 *    (e.g. "EMAIL_NOT_VERIFIED") without parsing human-readable messages.
 *  - `isOperational: true` tells the global handler it's safe to forward
 *    the message to the client. Unexpected errors (isOperational: false)
 *    get a generic "Internal Server Error" in production.
 */
export class AppError extends Error {
    /**
     * @param {string} message     - Human-readable description (sent to client)
     * @param {number} statusCode  - HTTP status code (default 400)
     * @param {string} [code]      - Machine-readable code for the frontend
     * @param {object} [meta]      - Any extra data to attach (e.g. { userId })
     */
    constructor(message, statusCode = 400, code = null, meta = {}) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.meta = meta;
        this.isOperational = true; // safe to expose to client

        // Maintains proper stack trace in V8
        Error.captureStackTrace(this, this.constructor);
    }
}

// ─── Convenience factories ────────────────────────────────────────────────────
// These keep throw-sites readable:
//   throw AppError.notFound("User not found")
//   throw AppError.unauthorized("Invalid credentials")

AppError.badRequest = (message, code = null, meta = {}) =>
    new AppError(message, 400, code, meta);

AppError.unauthorized = (message, code = null, meta = {}) =>
    new AppError(message, 401, code, meta);

AppError.forbidden = (message, code = null, meta = {}) =>
    new AppError(message, 403, code, meta);

AppError.notFound = (message, code = null, meta = {}) =>
    new AppError(message, 404, code, meta);

AppError.conflict = (message, code = null, meta = {}) =>
    new AppError(message, 409, code, meta);

AppError.internal = (message, code = null, meta = {}) =>
    new AppError(message, 500, code, meta);