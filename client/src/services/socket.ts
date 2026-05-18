import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000"; // Match the NestJS port

export const socket = io(SOCKET_URL, {
  autoConnect: true, // Connects as soon as the app loads
});
