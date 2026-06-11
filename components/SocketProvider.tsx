"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        // Dynamic socket URL based on env or window host (to support production server deployment on LAN)
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
            (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");

        const socketInstance = io(socketUrl, {
            transports: ["websocket"],
            autoConnect: true,
            auth: {
                token: token
            }
        });

        socketInstance.on("connect", () => {
            console.log("Connected to WebSocket");
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("Disconnected from WebSocket");
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
