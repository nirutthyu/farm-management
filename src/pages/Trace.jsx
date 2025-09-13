import React, { useState, useEffect } from "react";

export default function Trace() {
  const [name, setName] = useState("");
  const [formData, setFormData] = useState({
    user: "",
    product: "",
    batchNumber: "",
    location: "",
    notes: "",
    timestamp: "",
  });

  // Load username and initialize timestamp
  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) {
      setName(user);
      setFormData((prev) => ({ ...prev, user })); // keep formData.user in sync
    }

    const now = new Date();
    setFormData((prev) => ({
      ...prev,
      timestamp: now.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }));
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Ensure user and timestamp are correct at submission
      const now = new Date();
      const dataToSend = {
        ...formData,
        user: name,
        timestamp: now.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      const res = await fetch("http://localhost:5000/api/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Trace data saved successfully!");
        // Reset form but keep user
        setFormData({
          user: name,
          product: "",
          batchNumber: "",
          location: "",
          notes: "",
          timestamp: dataToSend.timestamp,
        });
      } else {
        throw new Error(data.error || "Error saving data");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save trace data.");
    }
  };

  // Styles
  const formStyle = {
    backgroundColor: "#ecececff",
    color: "#000",
    padding: "30px",
    maxWidth: "600px",
    margin: "50px auto",
    borderRadius: "10px",
    fontFamily: "Arial, sans-serif",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    marginBottom: "20px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: "#fff",
    color: "#000",
    fontSize: "16px",
  };

  const labelStyle = { fontWeight: "bold", fontSize: "16px", display: "block" };
  const buttonStyle = {
    backgroundColor: "#28a745",
    color: "#000",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  };

  return (
    <div style={formStyle}>
      <h2>Traceability Form</h2>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Product Name:</label>
        <input
          type="text"
          name="product"
          value={formData.product}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Batch Number:</label>
        <input
          type="text"
          name="batchNumber"
          value={formData.batchNumber}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Location:</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Notes:</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          style={{ ...inputStyle, height: "100px", resize: "vertical" }}
        />

        <label style={labelStyle}>Date & Time (auto):</label>
        <input type="text" value={formData.timestamp} disabled style={inputStyle} />

        <button type="submit" style={buttonStyle}>
          Submit
        </button>
      </form>
    </div>
  );
}
