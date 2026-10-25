// Placeholder for POST /api/jokes. Implemented in Milestone 2; the UI does not call it yet.
export async function POST() {
  return new Response(null, {
    status: 501,
    headers: { "Cache-Control": "no-store" },
  });
}
