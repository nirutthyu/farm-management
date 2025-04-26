import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminPage from "./pages/AdminPage";
import AddItemPage from "./pages/AddItem";
import FertilizerDetection from "./pages/FertilizerDetection";
import SensorControl from "./pages/SensorControl";
import RegisterForm from "./pages/RegisterForm";
import Login from "./pages/Login"
import "./App.css";

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* <Route path="/" element={<RegisterForm />} />
          <Route path="/login" element={<Login />} /> */}
          <Route path="/home" element={<LandingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/add-item" element={<AddItemPage />} />
          <Route path="/fertilizer-detection" element={<FertilizerDetection />} />
          <Route path="/sensor-control" element={<SensorControl />} />
        </Routes>
      </div>
    </Router>
  );
}
