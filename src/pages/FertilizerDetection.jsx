import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiChevronUp, FiInfo } from "react-icons/fi";

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

  const [results, setResults] = useState({
    prediction: null,
    recommendation: null,
    loading: false,
    error: null
  });

  const [expandedSection, setExpandedSection] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleDetect = async () => {
    const cleanedData = {
      temperature: parseFloat(formData.temperature),
      humidity: parseFloat(formData.humidity),
      moisture: parseFloat(formData.moisture),
      soil: formData.soil.toLowerCase(),
      crop: formData.crop.toLowerCase(),
      nitrogen: parseFloat(formData.nitrogen),
      phosphorous: parseFloat(formData.phosphorous),
      potassium: parseFloat(formData.potassium),
    };

    setResults({ ...results, loading: true, error: null });

    try {
      const [predictionResponse, recommendationResponse] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/fertilizer-predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        }),
        fetch("http://127.0.0.1:5000/api/recommend-fertilizer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        })
      ]);

      if (!predictionResponse.ok || !recommendationResponse.ok) {
        const predictionError = await predictionResponse.json().catch(() => null);
        const recommendationError = await recommendationResponse.json().catch(() => null);
        throw new Error(predictionError?.error || recommendationError?.error || "Request failed");
      }

      const [predictionData, recommendationData] = await Promise.all([
        predictionResponse.json(),
        recommendationResponse.json()
      ]);

      setResults({
        prediction: predictionData.fertilizer,
        recommendation: recommendationData,
        loading: false,
        error: null
      });

    } catch (err) {
      console.error("Error:", err);
      setResults({
        ...results,
        loading: false,
        error: err.message || "Failed to get fertilizer recommendations"
      });
    }
  };

  return (
    <motion.div
      className="fertilizer-container"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="fertilizer-title">Fertilizer Recommendation System</h2>

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
            disabled={results.loading}
          >
            {results.loading ? "Processing..." : "Get Recommendations"}
          </motion.button>
        </div>

        {/* Right Result Section */}
        <div className="fertilizer-result">
          {results.error ? (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {results.error}
            </motion.div>
          ) : results.loading ? (
            <motion.div
              className="loading-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Analyzing your farm data...
            </motion.div>
          ) : results.prediction || results.recommendation ? (
            <div className="results-container">
              {/* Model Prediction Card */}
              <motion.div 
                className="result-card prediction-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="result-title">
                  <FiInfo className="icon" /> Model Prediction
                </h3>
                <p className="result-text">{results.prediction}</p>
              </motion.div>

              {/* AI Recommendation Card */}
              {results.recommendation && (
                <motion.div
                  className="result-card recommendation-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="card-header">
                    <h3 className="result-title">
                      <FiInfo className="icon" /> AI Recommendation
                    </h3>
                  </div>

                  <div className="card-content">
                    <div className="primary-recommendation">
                      <p className="highlight-text">
                        <strong>Recommended:</strong> {results.recommendation.RecommendedFertilizer}
                      </p>
                    </div>

                    {/* Alternatives Section */}
                    <div className="collapsible-section">
                      <button 
                        className="toggle-button"
                        onClick={() => toggleSection('alternatives')}
                      >
                        {expandedSection === 'alternatives' ? <FiChevronUp /> : <FiChevronDown />}
                        Alternatives
                      </button>
                      <AnimatePresence>
                        {expandedSection === 'alternatives' && results.recommendation.Alternatives?.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="section-content"
                          >
                            <ul>
                              {results.recommendation.Alternatives.map((alt, i) => (
                                <li key={i}>{alt}</li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Scientific Reasoning Section */}
                    <div className="collapsible-section">
                      <button 
                        className="toggle-button"
                        onClick={() => toggleSection('reasoning')}
                      >
                        {expandedSection === 'reasoning' ? <FiChevronUp /> : <FiChevronDown />}
                        Scientific Reasoning
                      </button>
                      <AnimatePresence>
                        {expandedSection === 'reasoning' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="section-content"
                          >
                            <p>{results.recommendation.ScientificReasoning}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Application Instructions Section */}
                    <div className="collapsible-section">
                      <button 
                        className="toggle-button"
                        onClick={() => toggleSection('instructions')}
                      >
                        {expandedSection === 'instructions' ? <FiChevronUp /> : <FiChevronDown />}
                        How to Apply
                      </button>
                      <AnimatePresence>
                        {expandedSection === 'instructions' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="section-content"
                          >
                            <p>{results.recommendation.ApplicationInstructions}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Expected Benefits Section */}
                    <div className="collapsible-section">
                      <button 
                        className="toggle-button"
                        onClick={() => toggleSection('benefits')}
                      >
                        {expandedSection === 'benefits' ? <FiChevronUp /> : <FiChevronDown />}
                        Organic Alternatives
                      </button>
                      <AnimatePresence>
                        {expandedSection === 'benefits' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="section-content"
                          >
                            <p>{results.recommendation.OrganicAlternatives}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div 
              className="placeholder-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p>Submit your farm details to get fertilizer recommendations</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}