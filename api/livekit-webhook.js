import { RoomServiceClient, EgressApi, IngressInfo } from "@livekit/server-sdk";
import WebSocket from "ws";

// Load env (Vercel exposes vars automatically)
const LIVEKIT_HOST = process.env.LIVEKIT_HOST;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Dummy safety fallback
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.log("⚠️ LiveKit credentials not set — using dummy placeholders");
}

// Create Realtime socket to OpenAI
function connectRealtime() {
  return new Promise((resolve) => {
    const ws = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
      {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
      }
    );

    ws.on("open", () => resolve(ws));
  });
}

// MAIN Webhook Handler
export default async function handler(req, res) {
  try {
    // (A) Receive webhook event from LiveKit Ingress
    const event = req.body;

    if (!event) {
      return res.status(400).json({ error: "Invalid LiveKit event" });
    }

    // (B) Create OpenAI realtime connection
    const aiSocket = await connectRealtime();

    // (C) If this is an audio chunk → send to AI
    if (event.audio) {
      const pcmChunk = event.audio; // Base64 PCM (LiveKit egress)
      aiSocket.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: pcmChunk
        })
      );
    }

    // (D) Return 200 OK to LiveKit
    res.status(200).json({ status: "received" });

    // (E) Listen for AI audio output
    aiSocket.on("message", async (msg) => {
      const data = JSON.parse(msg.toString());

      if (data.type === "response.audio.delta") {
        // Send audio back to LiveKit Egress (placeholder)
        console.log("AI audio chunk:", data.delta);
      }

      if (data.type === "response.text.delta") {
        console.log("AI partial transcript:", data.delta);
      }
    });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
}
