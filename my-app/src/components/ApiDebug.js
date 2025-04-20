// src/components/ApiDebug.js
import React, { useState } from 'react';

function ApiDebug({ onTest }) {
  const [apiUrl, setApiUrl] = useState(process.env.REACT_APP_STRAPI_API_URL || 'http://localhost:1337');
  const [endpoint, setEndpoint] = useState('/api/products');
  const [token, setToken] = useState('e079b7941374b48c662636432577b96aa05d99cc68b4750b76e6590bb644e9bb4b8a4c7e5f3273f3873762ec45deb8e779f0d0130e941d6e694c9d7fe3404f505da20ba9b1d4ef425bd5af69418c1fa7d2c165f4a45079a2ecbff5fa796fb81a057e563e25a94519676d68af4a81c71677e9fb0ef218456bff803ddbeb44d5a9');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        }
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { text: responseText };
      }
      
      setResults({
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      if (response.ok && onTest) {
        onTest(endpoint, data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-debug">
      <h3>API Connection Debugger</h3>
      <div className="form-group">
        <label>API URL:</label>
        <input 
          type="text" 
          value={apiUrl} 
          onChange={(e) => setApiUrl(e.target.value)} 
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label>Endpoint:</label>
        <input 
          type="text" 
          value={endpoint} 
          onChange={(e) => setEndpoint(e.target.value)} 
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label>Token:</label>
        <input 
          type="text" 
          value={token} 
          onChange={(e) => setToken(e.target.value)} 
          className="form-control"
        />
      </div>
      
      <button onClick={testConnection} disabled={loading}>
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      
      {error && <div className="error-message">Error: {error}</div>}
      
      {results && (
        <div className="results">
          <h4>Results</h4>
          <p>Status: {results.status} ({results.ok ? 'OK' : 'Error'})</p>
          <pre>{JSON.stringify(results.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default ApiDebug;