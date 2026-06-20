// AtlasReady.jsx
// Plain-English: This page confirms the Atlas is loaded and ready.
// It fetches species + trails using your real API functions.

import { useState, useEffect } from "react";
import { listSpecies, listTrails } from "@/api/entities";

export default function AtlasReady() {
  const [species, setSpecies] = useState([]);
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [speciesData, trailsData] = await Promise.all([
          listSpecies(),
          listTrails(),
        ]);

        setSpecies(speciesData || []);
        setTrails(trailsData || []);
      } catch (err) {
        console.error("Error loading Atlas data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", fontSize: "1.5rem" }}>
        Loading Atlas…
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Atlas Ready
      </h1>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Species Loaded</h2>
        <p>{species.length} species available</p>
      </div>

      <div>
        <h2>Trails Loaded</h2>
        <p>{trails.length} trails available</p>
      </div>
    </div>
  );
}
