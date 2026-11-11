import { config } from "./config";
import { AppError } from "./errors";

interface EmbedResult {
  embedding: number[];
  faces: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return -1;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : -1;
}

/** Best candidate at or above the threshold, or null. */
export function bestMatch(
  probe: number[],
  candidates: { id: string; embedding: number[] }[],
  threshold = config.FACE_MATCH_THRESHOLD,
): { id: string; score: number } | null {
  let best: { id: string; score: number } | null = null;
  for (const c of candidates) {
    const score = cosineSimilarity(probe, c.embedding);
    if (score >= threshold && (!best || score > best.score)) best = { id: c.id, score };
  }
  return best;
}

// Exported as an object so tests can stub the network call.
export const faceClient = {
  async embed(image: string): Promise<EmbedResult> {
    let res: Response;
    try {
      res = await fetch(`${config.FACE_SERVICE_URL.replace(/\/$/, "")}/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Service-Token": config.FACE_SERVICE_TOKEN },
        body: JSON.stringify({ image }),
        signal: AbortSignal.timeout(90_000), // the face service may be cold-starting
      });
    } catch {
      throw new AppError(503, "Face recognition service is unavailable, please retry in a moment");
    }
    const body = (await res.json().catch(() => ({}))) as Partial<EmbedResult> & { error?: string };
    if (res.status === 422 || res.status === 413) throw new AppError(422, body.error ?? "Could not process image");
    if (!res.ok || !Array.isArray(body.embedding)) {
      throw new AppError(502, "Face recognition service returned an error");
    }
    return { embedding: body.embedding, faces: body.faces ?? 1 };
  },
};
