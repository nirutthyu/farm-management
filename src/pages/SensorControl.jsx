import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function SensorControl() {
  const [forecast, setForecast] = useState([]);
  const [sensorStatus, setSensorStatus] = useState("off"); // new state for buttons
  const [relayStatus, setRelayStatus] = useState("Unknown");
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);

  // Fetch status from Flask
  const fetchStatus = async () => {
    try {
      const res = await fetch("http://10.208.25.66:5000/status");
      const data = await res.json();
      setRelayStatus(data.relay);
      setTemperature(data.temperature);
      setHumidity(data.humidity);
    } catch (err) {
      console.error("Status fetch error:", err);
    }
  };
  // SensorControl.jsx (only relevant changes)
const turnOnRelay = async () => {
  try {
    await fetch("http://10.208.25.66:5000/on"); // call backend
    setSensorStatus("on"); // update local state
    fetchStatus(); // fetch current relay status & sensor info
  } catch (err) {
    console.error("Failed to turn on relay:", err);
  }
};

const turnOffRelay = async () => {
  try {
    await fetch("http://10.208.25.66:5000/off"); // call backend
    setSensorStatus("off"); // update local state
    fetchStatus();
  } catch (err) {
    console.error("Failed to turn off relay:", err);
  }
};

  useEffect(() => {
    fetch("http://localhost:5000/forecast")
      .then((res) => res.json())
      .then((data) => setForecast(data));
  }, []);

  return (
    <motion.div
      className="sensor-container p-6 bg-white rounded-2xl shadow-lg mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        🌦 Weekly Rain Forecast – Madurai
      </h2>

    <div className="flex justify-center gap-4 mb-6">
  <button
    onClick={turnOnRelay}
    className={`px-6 py-2 rounded-lg font-semibold ${
      sensorStatus === "on" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-800"
    }`}
  >
    On
  </button>
  <br></br>
  <br></br>
  <button
    onClick={turnOffRelay}
    // className={`px-6 py-2 rounded-lg font-semibold ${
    //   sensorStatus === "off" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-800"
    // }`}
  >
    Off
  </button>
</div>


      {/* Current sensor status */}
      {/* <p className="text-center text-gray-700 mb-4">
        Sensor is currently:{" "}
        <span className={sensorStatus === "on" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
          {sensorStatus.toUpperCase()}
        </span>
      </p> */}
      <br></br>

      {forecast.length === 0 ? (
        <p className="text-gray-500 text-center">Loading forecast...</p>
      ) : (
        <div className="flex justify-center">
          <div className="overflow-x-auto w-full">
            <table className="mx-auto bg-white rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  {forecast.map((day, index) => (
                    <th key={index} className="py-3 px-4 text-center font-semibold text-gray-700">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {forecast.map((day, index) => (
                    <td key={index} className="py-3 px-4 text-center border-t">
                      <motion.div
                        className={`p-4 rounded-xl shadow-md ${
                          day.chance_of_rain > 70
                            ? "bg-blue-200"
                            : day.chance_of_rain > 30
                            ? "bg-yellow-200"
                            : "bg-green-200"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        style={{ textAlign: "center" }}
                      >
                        <p className="text-xl font-bold">💧 {day.chance_of_rain}%</p>
                        <p className="text-sm text-gray-600 mb-2">{day.date.split("-").pop()}</p>
                      </motion.div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
