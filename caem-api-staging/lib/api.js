// lib/api.js
export async function apiRequest(path, method = "GET", body = null, apiKey) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
  const url = `${base}${path}`;

  const headers = {
    "Content-Type": "application/json"
  };

  if (apiKey) headers["x-api-key"] = apiKey;

  const opts = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  };

  const res = await fetch(url, opts);

  // Manejo de errores descriptivo
  if (!res.ok) {
    let error = { status: res.status, message: res.statusText };
    try {
      const json = await res.json();
      if (json && json.error) error.message = json.error;
    } catch (e) {
      // ignore JSON parse error
    }
    const err = new Error(error.message || "API error");
    err.status = error.status;
    throw err;
  }

  // Si no hay body, devolver null
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}