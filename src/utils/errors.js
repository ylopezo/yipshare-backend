
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}

export class InternalServerError extends AppError {
    constructor(message = "Internal Server Error") {
        super(message, 500);
    }
}
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}

export class BadRequestError extends AppError {
    constructor(message = "BadRequest") {
        super(message, 400);
    }
}

export class UnsupportedMediaTypeError extends AppError {
    constructor(message = "UnsupportedMediaType") {
        super(message, 415);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = "TooManyRequests") {
        super(message, 429);
    }
}
