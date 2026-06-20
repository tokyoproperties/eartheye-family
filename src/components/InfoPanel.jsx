// src/components/InfoPanel.jsx
export default function InfoPanel({ feature, onClose }) {
  if (!feature) return null;

  return (
    <div className="info-panel">
      <button className="close-btn" onClick={onClose}>×</button>

      <div className="species-photo">
        <img 
          src={feature.photo || "/placeholder-species.jpg"} 
          alt={feature.name} 
        />
      </div>

      <h2>{feature.name}</h2>

      <div className="info-section">
        <p><strong>Type:</strong> {feature.type}</p>
        <p><strong>Habitat:</strong> {feature.habitat || "Unknown"}</p>
        <p><strong>Range:</strong> {feature.range || "Unknown"}</p>
      </div>
    </div>
  );
}
