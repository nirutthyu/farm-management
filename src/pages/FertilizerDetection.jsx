import { useState } from "react";
import { motion } from "framer-motion";

export default function FertilizerDetection() {
  const [formData, setFormData] = useState({
    temperature: "",
    humidity: "",
    moisture: "",
    soil: "",
    crop: "",
    nitrogen: "",
    phosphorous: "",
    potassium: "",
  });

  const [result, setResult] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDetect = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/fertilizer-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data.fertilizer); // expecting { fertilizer: "some result" }
    } catch (err) {
      console.error(err);
      setResult("Failed to detect fertilizer.");
    }
  };

  return (
    <motion.div
  className="fertilizer-container"
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  <h2 className="fertilizer-title">Fertilizer Detection</h2>

  <div className="fertilizer-layout">
    {/* Left Form Section */}
    <div className="fertilizer-form">
      {["temperature", "humidity", "moisture", "nitrogen", "phosphorous", "potassium"].map((field) => (
        <input
          key={field}
          type="number"
          name={field}
          value={formData[field]}
          onChange={handleChange}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          className="input-field"
        />
      ))}

      <select name="soil" value={formData.soil} onChange={handleChange} className="input-field">
        <option value="">Select Soil Type</option>
        <option value="Sandy">Sandy</option>
        <option value="Loamy">Loamy</option>
        <option value="Black">Black</option>
        <option value="Red">Red</option>
        <option value="Clayey">Clayey</option>
      </select>

      <select name="crop" value={formData.crop} onChange={handleChange} className="input-field">
        <option value="">Select Crop Type</option>
        <option value="Wheat">Wheat</option>
        <option value="Rice">Rice</option>
        <option value="Sugarcane">Sugarcane</option>
        <option value="Maize">Maize</option>
        <option value="Cotton">Cotton</option>
      </select>

      <motion.button
        className="submit-button"
        onClick={handleDetect}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Detect Fertilizer
      </motion.button>
    </div>

    {/* Right Result Section */}
    <div className="fertilizer-result">
      {result ? (
        <>
          <h3 className="result-title">Recommended Fertilizer</h3>
          <p className="result-text">{result}</p>
          <p className="result-explanation">
            This fertilizer is recommended based on the soil, crop, and nutrient levels you provided. It helps improve yield and maintain soil health.
          </p>
        </>
      ) : (
        <p className="placeholder-text">Detected fertilizer explanation will appear here.</p>
      )}
    </div>
  </div>
</motion.div>

  );
}
