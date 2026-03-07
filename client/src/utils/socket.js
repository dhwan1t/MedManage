import { io } from "socket.io-client";

/**
 * Shared Socket.IO configuration utility.
 *
 * P2-11: Centralizes the socket URL so no component hardcodes "localhost:5001".
 * P0-05 (client side): Automatically attaches the JWT auth token from
 *        localStorage so the server's socket auth middleware can verify it.
 *
 * Usage:
 *   import { createSocket } from '../utils/socket';
 *   const socket = createSocket();
 *   // ... use socket ...
 *   socket.disconnect();
 */

// Read from Vite env var, fall back to relative (empty string) which lets
// the Vite proxy handle it in dev, or the same-origin in production.
const SOCKET_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_SOCKET_URL) ||
  "";

/**
 * Creates and returns a new Socket.IO client instance with authentication.
 *
 * @param {Object} [options] - Additional socket.io-client options to merge in.
 * @returns {import("socket.io-client").Socket} The connected socket instance.
 */
export function createSocket(options = {}) {
  const token = localStorage.getItem("token");

  const socket = io(SOCKET_URL, {
    auth: {
      token: token || "",
    },
    // Reconnect automatically if disconnected
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Merge any caller-provided options
    ...options,
  });

  socket.on("connect_error", (err) => {
    if (
      err.message.includes("Authentication required") ||
      err.message.includes("Authentication failed")
    ) {
      console.warn(
        "[socket] Authentication error — user may need to log in again:",
        err.message,
      );
    } else {
      console.warn("[socket] Connection error:", err.message);
    }
  });

  return socket;
}

/**
 * Returns the configured socket URL for debugging/display purposes.
 * @returns {string}
 */
export function getSocketUrl() {
  return SOCKET_URL || window.location.origin;
}

export default createSocket;
