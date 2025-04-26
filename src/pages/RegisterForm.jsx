import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db, ref, set } from "../firebase";

export default function RegisterForm() {
  const [newUser, setNewUser] = useState({ name: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await set(ref(db, "users/" + newUser.name), {
        name: newUser.name,
        password: newUser.password,
      });
      alert("Registration successful! Please log in.");
      navigate("/login"); // ✅ go to login page after register
    } catch (error) {
      console.error("Registration error:", error);
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
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login here</Link></p>
    </div>
  );
}
