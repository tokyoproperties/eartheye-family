// restClient.js
// Plain-English: This is the waiter. You ask it for data, it brings data back.

const API_BASE = "https://YOUR_API_URL_HERE";   // TODO: replace later
const API_KEY = "YOUR_API_KEY_HERE";            // TODO: replace later

function makeHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  // If your API uses a key, this adds it.
  if (API_KEY !== "YOUR_API_KEY_HERE") {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  return headers;
}

// GET = read data
export async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: makeHeaders(),
  });

  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }

  return res.json();
}

// POST = create data
export async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status}`);
  }

  return res.json();
}

// PUT = update data
export async function putJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: makeHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`PUT ${path} failed: ${res.status}`);
  }

  return res.json();
}

// DELETE = delete data
export async function deleteJSON(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: makeHeaders(),
  });

  if (!res.ok) {
    throw new Error(`DELETE ${path} failed: ${res.status}`);
  }

  return res.json();
}
