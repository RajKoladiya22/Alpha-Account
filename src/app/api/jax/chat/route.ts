import { NextResponse } from "next/server";
import { JaxAgentGateway } from "../../../../core/ai/jax-agent-gateway";

const jaxGateway = new JaxAgentGateway();

export async function POST(req: Request) {
  try {
    const { prompt, tenantId = "tenant-pbstylehomes", userId = "user-barinder" } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const stream = jaxGateway.processStreamingPrompt(tenantId, userId, prompt);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return NextResponse.json({ success: true, chunks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process JAX request" }, { status: 500 });
  }
}
