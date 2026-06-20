// entities.js
// Plain-English: These are the "things" in your world.
// Species, Trails, Habitats, etc. Each one uses the waiter (restClient).

import { getJSON, postJSON, putJSON, deleteJSON } from "./restClient";

// ─────────────────────────────────────────────────────────────
// SPECIES API
// These functions talk to your /species endpoint.
// ─────────────────────────────────────────────────────────────

export async function listSpecies() {
  return getJSON("/species");
}

export async function getSpeciesById(id) {
  return getJSON(`/species/${id}`);
}

export async function createSpecies(data) {
  return postJSON("/species", data);
}

export async function updateSpecies(id, data) {
  return putJSON(`/species/${id}`, data);
}

export async function deleteSpecies(id) {
  return deleteJSON(`/species/${id}`);
}

// ─────────────────────────────────────────────────────────────
// TRAILS API
// These functions talk to your /trails endpoint.
// ─────────────────────────────────────────────────────────────

export async function listTrails() {
  return getJSON("/trails");
}

// Add more entities later using the same pattern.
