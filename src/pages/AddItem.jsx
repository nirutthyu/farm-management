import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AddItemPage() {
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [items, setItems] = useState([]);
  const [farmerId] = useState('example_farmer_id');

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  const handleAddItem = async () => {
    if (!product || !price) return alert("Enter product and price");

    const newItem = { farmerId, product, price: parseFloat(price) };

    try {
      const response = await fetch("http://localhost:5000/api/add-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });

      if (!response.ok) throw new Error("Request failed");

      setItems(prev => [...prev, { product, price }]);
      setProduct('');
      setPrice('');
    } catch (err) {
      alert("Failed to add item");
    }
  };

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
          Add Item
        </motion.button>
      </div>

      <div className="items-display">
        <h3>Added Items</h3>
        {items.length === 0 ? (
          <p>No items added yet.</p>
        ) : (
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                <strong>{item.product}</strong>: ₹{item.price}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
