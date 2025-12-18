import React from "react";
import "./Alert.css";

export default function Alert({ type = "error", title, message, onClose }) {
  return (
    <div className="alert-overlay">
      <div className={`alert-box ${type}`}>
        <button className="alert-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="alert-title">{title}</div>
        <div className="alert-message">{message}</div>
      </div>
    </div>
  );
}
