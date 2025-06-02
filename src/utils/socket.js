// // utils/socket.js
// import { io } from "socket.io-client";

// const socket = io("http://192.168.1.11:7777", {
//   transports: ["websocket"],
//   autoConnect: false,
// });

// export default socket;

import io from 'socket.io-client';

// Replace with your actual server URL
const SOCKET_URL = 'http://192.168.1.102:7777'; // Use your computer's IP address for mobile testing
// For Android emulator, use: 'http://10.0.2.2:3000'
// For iOS simulator, use: 'http://localhost:3000'

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
  timeout: 20000,
  forceNew: true
});

// Add connection event handlers for debugging
socket.on('connect', () => {
  console.log('🔌 Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🔌 Socket connection error:', error.message);
});

export default socket;