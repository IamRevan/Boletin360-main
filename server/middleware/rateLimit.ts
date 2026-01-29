import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased to 1000 to accommodate polling (18 requests/min per user)
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intente nuevamente en 15 minutos.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
        error: 'Demasiados intentos de inicio de sesión, intente nuevamente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter for sensitive operations (create, update, delete)
export const mutationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 mutations per minute
    message: {
        error: 'Demasiadas operaciones, intente nuevamente en un momento.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
