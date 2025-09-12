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
    "BACTERIAL LEAF BLIGHT OF PADDY": {
      description: "Caused by Xanthomonas oryzae. Symptoms include wilting and yellowing of leaves.",
      remedy: "Use resistant varieties, avoid high nitrogen, apply copper-based fungicides.",
    },
    "BACTERIAL LEAF STREAK OF PADDY": {
      description: "Characterized by thin, yellow-orange streaks between veins.",
      remedy: "Ensure proper drainage, use resistant seeds, avoid excessive nitrogen.",
    },
    "BAKANAE": {
      description: "Caused by Fusarium fujikuroi. Leads to abnormal elongation and weak stems.",
      remedy: "Use fungicide-treated seeds, maintain clean nursery beds.",
    },
    "BROWN SPOT IN PADDY": {
      description: "Small brown lesions on leaves, reducing photosynthesis.",
      remedy: "Apply balanced fertilizers, treat seeds with fungicides.",
    },
    "BLAST OF PADDY": {
      description: "Caused by Magnaporthe oryzae. Triangular lesions on leaves and stems.",
      remedy: "Use resistant varieties, apply tricyclazole fungicide.",
    },
    "FALSE SMUT": {
      description: "Greenish spore balls appear on rice grains.",
      remedy: "Apply copper fungicides, practice crop rotation.",
    },
    "GRAIN DISCOLOURATION": {
      description: "Rice grains appear black or brown, reducing quality.",
      remedy: "Dry grains properly, store under dry conditions.",
    },
    "RICE TANGRO": {
      description: "Viral disease spread by green leafhoppers.",
      remedy: "Control vector population, use resistant varieties.",
    },
    "SHEATH BLIGHT OF PADDY": {
      description: "Caused by Rhizoctonia solani, lesions form on sheaths and spread.",
      remedy: "Maintain proper spacing, apply fungicides like hexaconazole.",
    },
    "SHEATH ROT OF PADDY": {
      description: "Lesions at panicle base, grains remain chaffy.",
      remedy: "Avoid high nitrogen, apply carbendazim fungicide.",
    },
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null);
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    }
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

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

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
    <div className="p-6 max-w-md mx-auto bg-white shadow-lg rounded-2xl text-center">
      <h2 className="text-xl font-bold mb-4">🌾 Paddy Plant Disease Detector</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      {preview && (
        <div className="mb-4">
          <img
            src={preview}
            alt="preview"
            className="w-64 h-64 object-cover mx-auto rounded-lg border"
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Predicting..." : "Predict"}
      </button>

      {result && (
        <div className="container-fluid bg-light">
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
          <h3 className="text-lg font-semibold">
            Prediction: <span className="text-green-700">{result.class}</span>
          </h3>
          <p className="text-white-700">
            Confidence: {(result.confidence * 100).toFixed(2)}%
          </p>

          {diseaseDetails && (
            <div className="mt-3">
              <p className="text-grey800">
                <strong>Description:</strong> {diseaseDetails.description}
              </p>
              <p className="text-grey-800 mt-2">
                <strong>Recommended Action:</strong> {diseaseDetails.remedy}
              </p>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}
