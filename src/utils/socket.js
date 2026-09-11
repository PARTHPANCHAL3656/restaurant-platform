import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://spice-garden-tau.vercel.app';

// Guard against SSR/build-time execution (Node has no `window`). Without this,
// importing this module during the prerender script opens a real, persistent
// socket connection inside the build process with nothing to ever close it —
// Node then never exits on its own, and the build just runs until Vercel's
// timeout kills it. In the browser this branch is always skipped.
const socket = typeof window !== 'undefined'
  ? io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })
  : {
      on: () => {},
      off: () => {},
      emit: () => {},
      once: () => {},
      connect: () => {},
      disconnect: () => {},
      removeAllListeners: () => {},
    };

export default socket;
