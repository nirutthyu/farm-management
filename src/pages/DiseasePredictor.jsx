import React, { useState } from "react";

export default function DiseasePredictor() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const diseaseInfo = {
    "HEALTHY PADDY": {
      description: "The plant is healthy. No visible disease symptoms detected.",
      remedy: "Continue normal farming practices and preventive care.",
    },
    "HISPA IN PADDY": {
      description: "Leaves get scraped, whitish streaks appear due to beetle feeding.",
      remedy: "Use insecticides like chlorpyrifos, and remove affected leaves.",
    },
    "BACTERIAL LEAF BLIGHT IN PADDY": {
      description:
        "Caused by Xanthomonas oryzae. Symptoms include wilting and yellowing of leaves.",
      remedy: "Use resistant varieties, avoid excess nitrogen, apply copper fungicides.",
    },
    "BACTERIAL LEAF STREAK IN PADDY": {
      description: "Characterized by thin, yellow-orange streaks between veins.",
      remedy: "Ensure proper drainage, use resistant seeds, avoid excessive nitrogen.",
    },
    "BACTERIAL PANACLE BLIGHT IN PADDY": {
      description: "Affects rice panicles, causing sterility and poor grain filling.",
      remedy: "Use clean seeds, apply bactericides, and practice field sanitation.",
    },
    "BLAST IN PADDY": {
      description: "Caused by Magnaporthe oryzae. Triangular lesions appear on leaves/stems.",
      remedy: "Use resistant varieties, apply tricyclazole fungicide.",
    },
    "BROWN SPOT IN PADDY": {
      description: "Small brown lesions reduce photosynthesis and yield.",
      remedy: "Apply balanced fertilizers, treat seeds with fungicides.",
    },
    "DEAD HEART IN PADDY": {
      description: "Stem borer larvae kill the central shoot, leading to dead hearts.",
      remedy: "Apply insecticides, destroy stubbles, and adopt pheromone traps.",
    },
    "DOWNY MILDEW IN PADDY": {
      description: "Fungal disease causing whitish growth on leaves.",
      remedy: "Apply metalaxyl fungicide, avoid waterlogging.",
    },
    "TUNGRO IN PADDY": {
      description: "Viral disease transmitted by leafhoppers. Plants appear stunted.",
      remedy: "Control leafhopper population, use resistant varieties.",
    },
    "APHIDS IN COTTON": {
      description: "Aphids suck sap, leading to curling and stunted growth.",
      remedy: "Spray imidacloprid or neem oil.",
    },
    "ARMY WORM IN COTTON": {
      description: "Larvae feed on leaves, causing skeletonized foliage.",
      remedy: "Use biological control (Trichogramma), apply insecticides if severe.",
    },
    "BACTERIAL BLIGHT IN COTTON": {
      description: "Angular leaf spots, boll rot, and black veins.",
      remedy: "Use resistant varieties, copper fungicides, and crop rotation.",
    },
    "POWDERY MILDEW IN COTTON": {
      description: "White powdery fungal growth on leaves.",
      remedy: "Apply sulfur fungicides or systemic fungicides.",
    },
    "TARGET SPOTS IN COTTON": {
      description: "Circular brown spots with concentric rings on leaves.",
      remedy: "Apply fungicides like carbendazim, ensure proper spacing.",
    },
    "HEALTHY COTTON": {
      description: "The plant is healthy with no signs of pests or diseases.",
      remedy: "Continue good agricultural practices.",
    },
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null);
    if (selectedFile) setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an image first!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Prediction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const diseaseDetails = result ? diseaseInfo[result.class] : null;
  return (
    <div style={styles.container}>
      {/* Upload Card */}
      <div style={styles.card}>
        <h2 style={styles.heading}>🌱 Plant Disease Detector</h2>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={styles.fileInput}
        />

        {preview && (
          <div style={styles.previewContainer}>
            <img src={preview} alt="preview" style={styles.previewImage} />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading}
          style={loading ? { ...styles.button, ...styles.disabledButton } : styles.button}
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
      </div>

      {/* Result Card */}
      {result && (
        <div style={styles.resultCard}>
          <h3 style={styles.resultHeading}>
            Prediction: <span style={styles.prediction}>{result.class}</span>
          </h3>
          <p style={styles.confidence}>
            Confidence: {(result.confidence * 100).toFixed(2)}%
          </p>

          {diseaseDetails ? (
            <div style={styles.details}>
              <p>
                <strong>Description:</strong> {diseaseDetails.description}
              </p>
              <p>
                <strong>Recommended Action:</strong> {diseaseDetails.remedy}
              </p>
            </div>
          ) : (
            <p style={styles.noDetails}>No additional information available.</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "700px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
    marginBottom: "2rem",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "1.5rem",
    color: "#2F855A",
  },
  fileInput: {
    marginBottom: "1rem",
  },
  previewContainer: {
    marginBottom: "1rem",
  },
  previewImage: {
    width: "250px",
    height: "200px",
    objectFit: "cover",
    borderRadius: "12px",
    border: "2px solid #E2E8F0",
  },
  button: {
    backgroundColor: "#2F855A",
    color: "#fff",
    padding: "0.75rem 2rem",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background-color 0.3s",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  resultCard: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  },
  resultHeading: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "1rem",
  },
  prediction: {
    color: "#2F855A",
  },
  confidence: {
    color: "#4A5568",
    marginBottom: "1rem",
  },
  details: {
    color: "#2D3748",
    lineHeight: "1.6",
  },
  noDetails: {
    color: "#E53E3E",
  },
};
