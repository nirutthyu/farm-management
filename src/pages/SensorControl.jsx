import { motion } from 'framer-motion';


export default function SensorControl() {
  return (
    <motion.div
      className="sensor-container"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="sensor-title">Sensor Control</h2>
      <p className="sensor-subtext">Page under construction...</p>
    </motion.div>
  );
}
