import { AccessToken } from "@livekit/server-sdk";

export default async function handler(req, res) {
  try {
    const { identity } = req.query;

    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "LIVEKIT_API_KEY_HERE";
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "LIVEKIT_API_SECRET_HERE";

    const room = `demo-${Math.random().toString(36).substring(2, 9)}`;
    const userIdentity = identity || `user_${Math.floor(Math.random() * 10000)}`;

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userIdentity,
      ttl: "1h",
      metadata: JSON.stringify({ agent: true })
    });

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = at.toJwt();

    res.status(200).json({
      token,
      room,
      identity: userIdentity,
      host: process.env.LIVEKIT_HOST || "wss://biswarup-mondal-g7k2q7d9.livekit.cloud"
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
