// Invariant 5: Socket.io & WebSocket Streaming Handler for JAX Assistant

import { JaxAgentGateway } from "../core/ai/jax-agent-gateway.ts";
import type { JaxStreamChunk } from "../core/ai/jax-agent-gateway.ts";

export interface MockSocketConnection {
  id: string;
  tenantId: string;
  userId: string;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (payload: any) => void) => void;
}

export class JaxSocketServer {
  private jaxGateway: JaxAgentGateway;

  constructor(jaxGateway: JaxAgentGateway) {
    this.jaxGateway = jaxGateway;
  }

  public registerSocket(socket: MockSocketConnection): void {
    socket.on("jax:prompt", async (payload: { prompt: string }) => {
      try {
        const stream = this.jaxGateway.processStreamingPrompt(
          socket.tenantId,
          socket.userId,
          payload.prompt
        );

        for await (const chunk of stream) {
          socket.emit("jax:stream_chunk", chunk);
        }
      } catch (err: any) {
        socket.emit("jax:stream_chunk", {
          type: "ERROR",
          content: err.message || "An error occurred while processing JAX prompt.",
        } as JaxStreamChunk);
      }
    });
  }
}
