// @swiftshopr/sdk/src/core/products.js

/**
 * Product shape returned from lookupProduct:
 * {
 *   barcode: string,      // UPC/EAN
 *   name: string,         // Product name
 *   price: number,        // Price in USD
 *   image?: string,       // Product image URL
 *   description?: string, // Product description
 *   category?: string,    // Product category
 *   inStock?: boolean,    // Availability
 *   metadata?: object,    // Additional retailer data
 * }
 */

// Simple in-memory cache for product lookups
const productCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCachedProduct = (barcode, storeId) => {
  const key = `${storeId}:${barcode}`;
  const cached = productCache.get(key);

  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    productCache.delete(key);
    return null;
  }

  return cached.product;
};

const setCachedProduct = (barcode, storeId, product) => {
  const key = `${storeId}:${barcode}`;
  productCache.set(key, {
    product,
    timestamp: Date.now(),
  });
};

/**
 * Clear the product cache.
 */
export const clearProductCache = () => {
  productCache.clear();
};

/**
 * Look up a product by barcode from the SwiftShopr backend.
 *
 * @param {Object} params
 * @param {string} params.barcode - UPC/EAN barcode
 * @param {string} params.storeId - Retailer store ID
 * @param {string} params.apiBaseUrl - Backend base URL
 * @param {string} params.apiKey - Retailer API key (x-swiftshopr-key)
 * @param {boolean} [params.useCache=true] - Whether to use cached results
 * @returns {Promise<Object|null>} Product object or null if not found
 */
export const lookupProduct = async ({
  barcode,
  storeId,
  apiBaseUrl,
  apiKey,
  useCache = true,
}) => {
  if (!apiBaseUrl) {
    throw new Error('Missing apiBaseUrl for product lookup');
  }
  if (!apiKey) {
    throw new Error('Missing apiKey for product lookup');
  }
  if (!barcode) {
    throw new Error('Missing barcode for product lookup');
  }
  if (!storeId) {
    throw new Error('Missing storeId for product lookup');
  }

  // Check cache first
  if (useCache) {
    const cached = getCachedProduct(barcode, storeId);
    if (cached) {
      return cached;
    }
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sdk/products/${encodeURIComponent(barcode)}?storeId=${encodeURIComponent(storeId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-swiftshopr-key': apiKey,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || `Product lookup failed (${response.status})`);
  }

  const payload = await response.json();

  if (!payload?.product) {
    return null;
  }

  const product = {
    barcode: payload.product.barcode || barcode,
    name: payload.product.name,
    price: parseFloat(payload.product.price) || 0,
    image: payload.product.image_url || payload.product.image,
    description: payload.product.description,
    category: payload.product.category,
    inStock: payload.product.in_stock !== false,
    metadata: payload.product.metadata || {},
  };

  // Cache the result
  if (useCache) {
    setCachedProduct(barcode, storeId, product);
  }

  return product;
};

/**
 * Look up multiple products by barcodes.
 *
 * @param {Object} params
 * @param {string[]} params.barcodes - Array of UPC/EAN barcodes
 * @param {string} params.storeId - Retailer store ID
 * @param {string} params.apiBaseUrl - Backend base URL
 * @param {string} params.apiKey - Retailer API key
 * @returns {Promise<Object>} Map of barcode -> product (or null)
 */
export const lookupProducts = async ({
  barcodes,
  storeId,
  apiBaseUrl,
  apiKey,
}) => {
  if (!Array.isArray(barcodes) || barcodes.length === 0) {
    return {};
  }

  // Look up each product (could be optimized with batch endpoint)
  const results = await Promise.allSettled(
    barcodes.map((barcode) =>
      lookupProduct({ barcode, storeId, apiBaseUrl, apiKey })
    )
  );

  const productMap = {};
  barcodes.forEach((barcode, index) => {
    const result = results[index];
    productMap[barcode] = result.status === 'fulfilled' ? result.value : null;
  });

  return productMap;
};

/**
 * Validate cart items against backend (price verification).
 *
 * @param {Object} params
 * @param {Array} params.items - Cart items to validate
 * @param {string} params.storeId - Retailer store ID
 * @param {string} params.apiBaseUrl - Backend base URL
 * @param {string} params.apiKey - Retailer API key
 * @returns {Promise<Object>} Validation result with updated prices if changed
 */
export const validateCart = async ({
  items,
  storeId,
  apiBaseUrl,
  apiKey,
}) => {
  if (!apiBaseUrl) {
    throw new Error('Missing apiBaseUrl for cart validation');
  }
  if (!apiKey) {
    throw new Error('Missing apiKey for cart validation');
  }
  if (!storeId) {
    throw new Error('Missing storeId for cart validation');
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sdk/cart/validate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-swiftshopr-key': apiKey,
    },
    body: JSON.stringify({
      storeId,
      items: items.map((item) => ({
        barcode: item.barcode,
        quantity: item.quantity,
        price: item.price,
      })),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || `Cart validation failed (${response.status})`);
  }

  const payload = await response.json();

  return {
    valid: payload.valid !== false,
    items: payload.items || [],
    subtotal: parseFloat(payload.subtotal) || 0,
    priceChanges: payload.price_changes || [],
    unavailableItems: payload.unavailable_items || [],
  };
};

export default {
  lookupProduct,
  lookupProducts,
  validateCart,
  clearProductCache,
};
