// @swiftshopr/sdk/src/components/CartProvider.jsx
import React from 'react';
import { CartContext, useCartState } from '../hooks/useCart';

/**
 * CartProvider - Provides cart state to all child components.
 *
 * @param {Object} props
 * @param {string} [props.storeId] - Initial store ID for the cart
 * @param {React.ReactNode} props.children - Child components
 *
 * @example
 * <CartProvider storeId="STORE001">
 *   <BarcodeScanner onScan={handleScan} />
 *   <CartView />
 *   <CheckoutButton />
 * </CartProvider>
 */
export const CartProvider = ({ storeId, children }) => {
  const cartState = useCartState(storeId);

  return (
    <CartContext.Provider value={cartState}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
