import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { JaxAgentGateway } from "./src/core/ai/jax-agent-gateway.ts";
import { JaxSocketServer } from "./src/server/socket-handler.ts";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  const jaxGateway = new JaxAgentGateway();
  const jaxSocketServer = new JaxSocketServer(jaxGateway);

  io.on("connection", (socket) => {
    const tenantId = (socket.handshake.query.tenantId) || "tenant-pbstylehomes";
    const userId = (socket.handshake.query.userId) || "user-barinder";
    jaxSocketServer.registerSocket({
      id: socket.id,
      tenantId,
      userId,
      emit: (event, data) => socket.emit(event, data),
      on: (event, cb) => socket.on(event, cb),
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Xero Enterprise Engine running on http://${hostname}:${port}`);
    console.log(`> Socket.io connected for real-time JAX AI streaming`);
  });
});
