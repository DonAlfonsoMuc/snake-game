const SUPABASE_URL = "https://vnzrhwmdxjnwszlffkqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuenJod21keGpud3N6bGZma3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDE0MDYsImV4cCI6MjA4NjgxNzQwNn0.KcSke_3NPnVbTBYBvKBKX6FkODgbDGihos6tLi8ocDA";

function buildHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

function buildUrl(pathAndQuery) {
  const base = SUPABASE_URL.endsWith("/") ? SUPABASE_URL.slice(0, -1) : SUPABASE_URL;
  return `${base}${pathAndQuery}`;
}

export function isScoresApiConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function fetchBestScore() {
  if (!isScoresApiConfigured()) {
    return null;
  }

  const response = await fetch(
    buildUrl("/rest/v1/scores?select=score&order=score.desc&limit=1"),
    {
      method: "GET",
      headers: buildHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch best score: ${response.status}`);
  }

  const rows = await response.json();
  return rows[0]?.score ?? null;
}

export async function submitScore(score, playerName = null) {
  if (!isScoresApiConfigured()) {
    return;
  }

  const response = await fetch(buildUrl("/rest/v1/scores"), {
    method: "POST",
    headers: {
      ...buildHeaders(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify([
      {
        score,
        player_name: playerName,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit score: ${response.status}`);
  }
}

export async function fetchTopScores(limit = 20) {
  if (!isScoresApiConfigured()) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const response = await fetch(
    buildUrl(
      `/rest/v1/scores?select=player_name,score,created_at&order=score.desc,created_at.asc&limit=${safeLimit}`,
    ),
    {
      method: "GET",
      headers: buildHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch top scores: ${response.status}`);
  }

  return response.json();
}
