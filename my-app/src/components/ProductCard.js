// src/components/ProductCard.js
import React from 'react';
import './ProductCard.css';

function ProductCard({ name, description, stock, createdAt, updatedAt, image }) {
  // Format dates to match the format in your screenshots
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };

  return (
    <div className="product-card">
      {image && (
        <div className="product-image">
          <img src={image.url} alt={name} />
        </div>
      )}
      <h2>{name || 'Produit'}</h2>
      <p className="description">{description || 'Test de produit en base de données'}</p>
      
      <div className="stock-info">
        <p>Stock disponible: <span className="stock-count">{stock || 0}</span></p>
      </div>

      <div className="dates">
        <p>Créé le {createdAt ? formatDate(createdAt) : 'N/A'}</p>
        <p>Modifié le {updatedAt ? formatDate(updatedAt) : 'N/A'}</p>
      </div>
    </div>
  );
}

export default ProductCard;