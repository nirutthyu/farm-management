import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function RegisterForm() {
  const [newUser, setNewUser] = useState({
    name: "",
    password: "",
    landSize: "",
    soilType: "",
    location: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send registration data to Flask backend
      await axios.post("http://localhost:5000/api/register", newUser);
      navigate("/login"); // Go to login page after registration
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          name="name"
          value={newUser.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={newUser.password}
          onChange={handleChange}
          required
        />

        <label htmlFor="landSize">Land Size (in acres):</label>
        <input
          type="number"
          id="landSize"
          name="landSize"
          value={newUser.landSize}
          onChange={handleChange}
          required
        />

        <label htmlFor="soilType">Soil Type:</label>
        <select
          id="soilType"
          name="soilType"
          value={newUser.soilType}
          onChange={handleChange}
          required
        >
          <option value="">Select soil type</option>
          <option value="loamy">Loamy</option>
          <option value="sandy">Sandy</option>
          <option value="clay">Clayey</option>
          <option value="silty">Black</option>
          <option value="peaty">Red</option>
        </select>

        <label htmlFor="location">Location:</label>
        <input
          type="text"
          id="location"
          name="location"
          value={newUser.location}
          onChange={handleChange}
          required
        />

        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}
