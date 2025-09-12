import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function AddItemPage() {
  const [username, setUsername] = useState('');
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [items, setItems] = useState([]);

  // Get logged-in username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) setUsername(storedUsername);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  // Add product via Flask API
  const handleAddItem = async () => {
    if (!product || !price) return alert("Enter product name and price");

    try {
      await axios.post(
        `http://localhost:5000/api/users/${username}/products`,
        { name: product, price: parseFloat(price) }
      );

      // Clear inputs
      setProduct('');
      setPrice('');

      // Refresh product list
      fetchItems();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product");
    }
  };

  // Fetch products for the user
  const fetchItems = async () => {
    if (!username) return;
    try {
      const response = await axios.get(
        `http://localhost:5000/api/users/${username}/products`
      );
      setItems(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setItems([]);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [username]);

  return (
    <motion.div
      className="add-item-wrapper"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="form-container">
        <h2 className="title">Add Your Product</h2>
        <motion.input
          type="text"
          placeholder="Product Name"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="input-field"
          whileFocus={{ scale: 1.02 }}
        />
        <motion.input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="input-field"
          whileFocus={{ scale: 1.02 }}
        />
        <motion.button
          onClick={handleAddItem}
          className="submit-button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Add Product
        </motion.button>
      </div>

      <div className="items-display">
        <h3>Your Products</h3>
        {items.length === 0 ? (
          <p>No products added yet.</p>
        ) : (
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                <strong>{item.name}</strong>: 	₹{item.price}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
