import { randomUUID } from "node:crypto";
import { createStream } from "./helper";

const users = new Map<string, { stream: ReturnType<typeof createStream> }>();

const server = Bun.serve<{ socketId: string }>({
  fetch(req, server) {
    const success = server.upgrade(req, {
      data: {
        socketId: randomUUID(),
      },
    });
    if (success) {
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    // handle HTTP request normally
    return new Response("Hi!");
  },

  websocket: {
    open(ws) {
      console.log("NEW CLIENT CONNECTED");
      const stream = createStream(ws);
      users.set(ws.data.socketId, { stream });
    },

    async message(ws, message) {
      const user = users.get(ws.data.socketId);

      if (!user) {
        console.error("No user found?", ws.data);
        return;
      }

      user.stream.write(message);
    },

    close(ws) {
      console.log("CLIENT LEFT");
      const user = users.get(ws.data.socketId);

      if (!user) {
        console.error("No user found?", ws.data);
        return;
      }

      user.stream.end();
    },
  },

  port: 3500,
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
