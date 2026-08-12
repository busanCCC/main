const STREAM_INTERNAL_URL =
  process.env.CCC_STREAM_INTERNAL_URL ?? "http://localhost:3002";
const INTERNAL_API_KEY =
  process.env.CCC_INTERNAL_API_KEY ?? "dev-internal-key-change-in-production";

export async function notifyStreamServer(
  path: string,
  body: Record<string, unknown>,
): Promise<void> {
  try {
    const res = await fetch(`${STREAM_INTERNAL_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": INTERNAL_API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[stream-notify] ${path} failed: ${res.status}`);
    }
  } catch (err) {
    console.warn(`[stream-notify] ${path} unreachable`, err);
  }
}
