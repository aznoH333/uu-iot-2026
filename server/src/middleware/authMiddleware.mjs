import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.mjs';

export const requireAuth = (req, res, next) => {
    const authorizationHeader = req.headers.authorization

    if (!authorizationHeader) {
        return res.status(401).json({
            message: 'Authorization token is required',
        })
    }

    const [scheme, token] = authorizationHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({
            message: 'Authorization header must use Bearer token format',
        })
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET)

        return next()
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token',
        })
    }
}
