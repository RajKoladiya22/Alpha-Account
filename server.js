import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const httpServer = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);

        // Simple lightweight health check endpoint
        if (parsedUrl.pathname === "/healthz" || parsedUrl.pathname === "/api/health") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }));
          return;
        }

        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("[ServerError] Error handling request:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    httpServer.listen(port, hostname, () => {
      console.log(`> Alpha Steel Frames Production System running on http://${hostname}:${port}`);
    });

    // Graceful shutdown handling for Hostinger process management
    const shutdown = () => {
      console.log("> Gracefully terminating server process...");
      httpServer.close(() => {
        console.log("> Server stopped cleanly.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  })
  .catch((err) => {
    console.error("[StartupError] Failed to initialize Alpha Steel Frames server:", err);
    process.exit(1);
  });
