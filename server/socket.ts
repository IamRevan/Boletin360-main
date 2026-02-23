import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { logger } from './logger';

export let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", // Adjust in production
            methods: ["GET", "POST"]
        }
    });

    // Authentication Middleware
    io.use((socket: Socket, next: (err?: Error) => void) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            logger.warn({ socketId: socket.id }, 'Socket connection attempt without token');
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            (socket as any).user = decoded;
            next();
        } catch (err) {
            logger.error({ socketId: socket.id, err }, 'Socket authentication failed');
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
