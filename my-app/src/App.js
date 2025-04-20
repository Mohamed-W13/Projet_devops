// Updated src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import ProductCard from './components/ProductCard';
import ApiDebug from './components/ApiDebug';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [workingEndpoint, setWorkingEndpoint] = useState(null);

  const fetchProducts = async (customEndpoint = null) => {
    try {
      const apiUrl = process.env.REACT_APP_STRAPI_API_URL || 'http://localhost:1337';
      const token = 'e079b7941374b48c662636432577b96aa05d99cc68b4750b76e6590bb644e9bb4b8a4c7e5f3273f3873762ec45deb8e779f0d0130e941d6e694c9d7fe3404f505da20ba9b1d4ef425bd5af69418c1fa7d2c165f4a45079a2ecbff5fa796fb81a057e563e25a94519676d68af4a81c71677e9fb0ef218456bff803ddbeb44d5a9';
      
      const endpoint = customEndpoint || workingEndpoint || '/api/products';
      const url = `${apiUrl}${endpoint}`;
      
      console.log("Attempting to fetch from:", url);
      
      const response = await fetch(url, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response Data:", data);
      
      // Handle different Strapi data structures
      if (data.data && Array.isArray(data.data)) {
        setProducts(data.data);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.data) {
        setProducts([data.data]);
      } else {
        setProducts([data]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!debugMode) {
      fetchProducts();
    }
  }, [debugMode, workingEndpoint]);

  const handleTestSuccess = (endpoint, data) => {
    setWorkingEndpoint(endpoint);
    console.log("Found working endpoint:", endpoint);
    
    // Try to extract products from the response
    if (data.data && Array.isArray(data.data)) {
      setProducts(data.data);
    } else if (Array.isArray(data)) {
      setProducts(data);
    } else if (data.data) {
      setProducts([data.data]);
    } else {
      setProducts([data]);
    }
    
    setError(null);
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Product Dashboard</h1>
        <button className="debug-toggle" onClick={toggleDebugMode}>
          {debugMode ? 'Exit Debug Mode' : 'Debug API Connection'}
        </button>
      </header>
      
      {debugMode ? (
        <ApiDebug onTest={handleTestSuccess} />
      ) : (
        <main className="product-container">
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : error ? (
            <div className="error-container">
              <div className="error">{error}</div>
              <button onClick={() => setDebugMode(true)} className="debug-button">
                Debug Connection
              </button>
            </div>
          ) : products.length > 0 ? (
            products.map(product => (
              <ProductCard 
                key={product.id || Math.random()}
                name={product.attributes?.name || product.name}
                description={product.attributes?.description || product.description}
                stock={product.attributes?.stock_available || product.stock_available}
                createdAt={product.attributes?.createdAt || product.createdAt}
                updatedAt={product.attributes?.updatedAt || product.updatedAt}
                image={product.attributes?.image?.data?.attributes || product.image}
              />
            ))
          ) : (
            <p className="no-products">No products found</p>
          )}
        </main>
      )}
    </div>
  );
}

export default App;