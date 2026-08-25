import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

// We use the secret key for the backend
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_placeholder",
});

export async function POST(request: NextRequest) {
  try {
    // For a real app, you'd check if the user is authenticated (e.g. with Privy)
    // For now, we generate a random user ID for anonymous users
    const userId = Math.random().toString(36).substring(2, 10);
    
    // Get the current room from the request body
    const body = await request.json();
    const { room } = body;

    // Start an auth session
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: `User ${userId.substring(0, 4)}`,
        color: "#FF4564"
      }
    });

    // Give full access to the room
    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    // Authorize the user and return the result
    const { status, body: authBody } = await session.authorize();
    
    return new Response(authBody, { status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
