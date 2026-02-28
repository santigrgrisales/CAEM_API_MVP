

export async function apiRequest(path, method = "GET", body = null, apiKey) {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:3000/api";

  const url = `${base}${path}`;

  const headers = {
    "Content-Type": "application/json",
  };

  if (apiKey) headers["x-api-key"] = apiKey;

  const opts = {
    method,
    headers,
  };

  if (body) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  if (!res.ok) {
    let errorMessage = res.statusText;

    try {
      const json = await res.json();
      if (json?.error) errorMessage = json.error;
    } catch (_) {}

    const err = new Error(errorMessage || "En este momento no se pueden ver a detalle más de 500 registros");
    err.status = res.status;
    throw err;
  }

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}