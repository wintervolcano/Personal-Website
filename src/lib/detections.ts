export type DetectionSnapshot = {
  id: string;
  count: number;
};

// Record a detection for a given pulsar ID.
// Returns the global count (1 = first person, 2 = second, …),
// or null if the backend isn't available.
export async function recordDetection(id: string): Promise<number | null> {
  try {
    const params = new URLSearchParams({ id });
    const res = await fetch(`/api/detections?${params.toString()}`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as DetectionSnapshot;
    return typeof data.count === "number" ? data.count : null;
  } catch {
    return null;
  }
}

