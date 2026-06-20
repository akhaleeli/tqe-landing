export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405, headers: cors });

    let email, source;
    try {
      ({ email, source } = await request.json());
    } catch {
      return new Response("Bad JSON", { status: 400, headers: cors });
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return new Response("Invalid email", { status: 422, headers: cors });

    await env.SUBSCRIBERS.put(
      `${Date.now()}:${email}`,
      JSON.stringify({ email, source: source || "daily", ts: new Date().toISOString() })
    );
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
