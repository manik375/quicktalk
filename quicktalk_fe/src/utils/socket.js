import io from 'socket.io-client';
import { store } from '../redux/Store';

let socket = null;

/**
 * Initialize a socket connection with the server
 * @param {string} token - User authentication token
 * @returns {object} The socket instance
 */
export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  // Create new socket connection
  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth: {
      token
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  // Socket connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('reconnect', (attempt) => {
    console.log('Socket reconnected after', attempt, 'attempts');
  });

  // Message events
  socket.on('new_message', (message) => {
    console.log('New message received via socket:', message);
    // Dispatch to Redux store if needed
    // store.dispatch({ type: 'chat/receiveMessage', payload: message });
  });

  // Typing events
  socket.on('typing', (data) => {
    console.log('Typing status received:', data);
    // Dispatch to Redux store if needed
    // store.dispatch({ type: 'chat/setTypingStatus', payload: data });
  });

  return socket;
};

/**
 * Get the current socket instance
 * @returns {object|null} The socket instance or null if not initialized
 */
export const getSocket = () => {
  return socket;
};

/**
 * Send a message through the socket
 * @param {object} messageData - The message data to send
 */
export const sendMessage = (messageData) => {
  console.log("sendMessage called with data:", JSON.stringify(messageData));
  
  if (!socket) {
    console.error("Socket is null, cannot send message");
    return Promise.reject(new Error("Socket is not initialized"));
  }
  
  if (!socket.connected) {
    console.error("Socket not connected, attempting to reconnect...");
    
    // Try to reconnect
    socket.connect();
    
    // Return a promise that rejects after a timeout
    return new Promise((resolve, reject) => {
      // Wait for connection
      setTimeout(() => {
        if (socket && socket.connected) {
          console.log("Socket reconnected, now sending message");
          // Try sending again
          socket.emit('send_message', messageData, (acknowledgment) => {
            if (acknowledgment && acknowledgment.success) {
              console.log("Message sent successfully after reconnect:", acknowledgment);
              resolve(acknowledgment);
            } else {
              console.error("Failed to send message after reconnect:", acknowledgment?.error || 'No acknowledgment');
              reject(new Error(acknowledgment?.error || 'Failed to send message after reconnect'));
            }
          });
        } else {
          console.error("Failed to reconnect socket");
          reject(new Error("Failed to reconnect socket"));
        }
      }, 1000);
    });
  }
  
  console.log("Socket connected, sending message:", JSON.stringify(messageData));
  return new Promise((resolve, reject) => {
    socket.emit('send_message', messageData, (acknowledgment) => {
      if (acknowledgment && acknowledgment.success) {
        console.log("Message sent successfully:", acknowledgment);
        resolve(acknowledgment);
      } else {
        console.error("Failed to send message:", acknowledgment?.error || 'No acknowledgment');
        reject(new Error(acknowledgment?.error || 'Failed to send message'));
      }
    });

    // Set a timeout for the acknowledgment
    setTimeout(() => {
      console.error("Socket message acknowledgment timeout");
      reject(new Error('Message acknowledgment timeout'));
    }, 5000);
  });
};

/**
 * Send typing status through the socket
 * @param {object} typingData - The typing status data to send
 */
export const sendTypingStatus = (typingData) => {
  if (socket && socket.connected) {
    socket.emit('typing', typingData);
  }
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected manually');
  }
}; 