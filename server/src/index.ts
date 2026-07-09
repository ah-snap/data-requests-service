import { handleRequests } from "./routes/requests";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is required");
  process.exit(1);
}

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check — no auth required
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    // Bearer token auth for all other routes
    const auth = req.headers.get("Authorization");
    if (!auth || auth !== `Bearer ${API_KEY}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      return await handleRequests(req);
    } catch (err) {
      console.error(err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});

console.log("Server running on port 3000");
