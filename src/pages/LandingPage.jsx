import React from "react";
import { Link } from "react-router-dom";


export default function LandingPage() {
  return (
    <div className="admin-landing-container">

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">Find Your Vendor</h1>
        <p className="hero-description">
          Manage your farm needs,products and crops at one place.
        </p>
      </section>


      {/* Admin Options */}
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
          <p>View and generate reports for Farm management.</p>
          <Link to="/sensor-control" className="option-link">Go to Farm Reports</Link>
        </div>
      </div>
    </div>
  );
}
