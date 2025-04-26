import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db, ref, get, child } from "../firebase";

export default function LoginForm() {
  const [loginData, setLoginData] = useState({ name: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dbRef = ref(db);
    try {
      const snapshot = await get(child(dbRef, `users/${loginData.name}`));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.password === loginData.password) {
          localStorage.setItem("username", loginData.name); // ✅ Save to show on Landing Page
          navigate("/home"); // ✅ Go to landing
        } else {
          alert("Incorrect password.");
        }
      } else {
        alert("User not found.");
      }
    } catch (error) {
      console.error("Login error:", error);
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
      <p>Don't have an account? <Link to="/">Register</Link></p>
    </div>
  );
}
