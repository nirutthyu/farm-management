import { useState } from 'react';
import { motion } from 'framer-motion';


export default function AdminPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    area: '',
    quantity: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      alert(`Logging in with ${formData.email}`);
    } else {
      alert(`Signing up ${formData.name}`);
    }
  };

  return (
    <motion.div
      className="admin-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="admin-title">{isLogin ? 'Admin Login' : 'Admin Signup'}</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="admin-input"
            />
            <input
              name="area"
              placeholder="Area of Production"
              value={formData.area}
              onChange={handleChange}
              className="admin-input"
            />
            <input
              name="quantity"
              placeholder="Production Quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              className="admin-input"
            />
          </>
        )}
        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="admin-input"
          type="email"
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="admin-input"
        />
        <motion.button
          type="submit"
          className="admin-button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isLogin ? 'Login' : 'Signup'}
        </motion.button>
        <p className="toggle-text">
          {isLogin ? 'New user?' : 'Already have an account?'}{' '}
          <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Signup' : 'Login'}
          </span>
        </p>
      </form>
    </motion.div>
  );
}
