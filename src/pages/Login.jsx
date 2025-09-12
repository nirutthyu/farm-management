import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function LoginForm() {
  const [loginData, setLoginData] = useState({ name: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/login", loginData);

      // Save user info to localStorage
      localStorage.setItem("username", res.data.user.name);
      localStorage.setItem("landSize", res.data.user.landSize);
      localStorage.setItem("soilType", res.data.user.soilType);
      localStorage.setItem("location", res.data.user.location);

      
      navigate("/home", { state: { user: res.data.user } });; // Go to landing page
    } catch (error) {
      console.error("Login error:", error);
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          name="name"
          value={loginData.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={loginData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/">Register</Link>
      </p>
    </div>
  );
}
