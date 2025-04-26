import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, ref, set,get,child, push, onValue } from '../firebase'; // Ensure the correct import path

export default function AddItemPage() {
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState([]);
  const username = localStorage.getItem('username'); // Get logged-in username from localStorage

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  const handleAddItem = async () => {
    if (!product || !quantity) return alert("Enter product and quantity");

    const newItem = { product, quantity: parseInt(quantity) };

    try {
      const userRef = ref(db, `users/${username}/products`);
      const newProductRef = push(userRef);
      await set(newProductRef, newItem);

      // Clear the input fields
      setProduct('');
      setQuantity('');
    } catch (error) {
      console.error("Firebase Error:", error);
      alert("Failed to add item");
    }
  };

  // Fetch products specific to the logged-in user
  useEffect(() => {
    if (!username) return;

    const userProductsRef = ref(db, `users/${username}/products`);
    onValue(userProductsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productArray = Object.values(data); // Convert data object to array
        setItems(productArray); // Set the fetched products to the state
      } else {
        setItems([]); // Set an empty array if no products exist
      }
    });
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
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
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
        <h3>Your Products</h3>
        {items.length === 0 ? (
          <p>No items added yet.</p>
        ) : (
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                <strong>{item.product}</strong>: {item.quantity}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
