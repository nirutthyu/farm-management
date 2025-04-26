import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <div className="admin-landing-container">
      <section className="hero-section">
        <h1 className="hero-title">Welcome, {username} 👋</h1>
        <p className="hero-description">
          Manage your farm needs, products, and crops all in one place.
        </p>
      </section>

      <div className="admin-options">
        <div className="option-card">
          <h2>Add Products</h2>
          <p>Add new products to the system.</p>
          <Link to="/add-item" className="option-link">Go to Add Products</Link>
        </div>

        <div className="option-card">
          <h2>Manage Fertilizers</h2>
          <p>Get smart fertilizer recommendations</p>
          <Link to="/fertilizer-detection" className="option-link">Go to Manage Fertilizers</Link>
        </div>

        <div className="option-card">
          <h2>Farm Reports</h2>
          <p>View and generate reports for farm management.</p>
          <Link to="/sensor-control" className="option-link">Go to Farm Reports</Link>
        </div>
      </div>
    </div>
  );
}
