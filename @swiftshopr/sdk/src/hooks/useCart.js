// @swiftshopr/sdk/src/hooks/useCart.js
import { useCallback, useContext, useMemo, createContext, useReducer } from 'react';

/**
 * Cart item shape:
 * {
 *   barcode: string,      // UPC/EAN
 *   name: string,         // Product name
 *   price: number,        // Price in USD
 *   quantity: number,     // Quantity in cart
 *   image?: string,       // Optional product image URL
 *   metadata?: object,    // Optional retailer-specific data
 * }
 */

const initialState = {
  items: [],
  storeId: null,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STORE': {
      return { ...state, storeId: action.storeId };
    }

    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.barcode === action.item.barcode
      );

      if (existingIndex >= 0) {
        // Item exists - increment quantity
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + (action.item.quantity || 1),
        };
        return { ...state, items: updatedItems };
      }

      // New item
      return {
        ...state,
        items: [...state.items, { ...action.item, quantity: action.item.quantity || 1 }],
      };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((item) => item.barcode !== action.barcode),
      };
    }

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.barcode !== action.barcode),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.barcode === action.barcode
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    }

    case 'INCREMENT': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.barcode === action.barcode
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }

    case 'DECREMENT': {
      const item = state.items.find((i) => i.barcode === action.barcode);
      if (item && item.quantity <= 1) {
        return {
          ...state,
          items: state.items.filter((i) => i.barcode !== action.barcode),
        };
      }

      return {
        ...state,
        items: state.items.map((i) =>
          i.barcode === action.barcode
            ? { ...i, quantity: i.quantity - 1 }
            : i
        ),
      };
    }

    case 'CLEAR': {
      return { ...state, items: [] };
    }

    case 'RESET': {
      return initialState;
    }

    default:
      return state;
  }
};

// Create context
export const CartContext = createContext(null);

/**
 * Hook to access and manage cart state.
 * Must be used within a CartProvider.
 */
export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};

/**
 * Hook that provides cart state and actions.
 * Used internally by CartProvider.
 */
export const useCartState = (initialStoreId = null) => {
  const [state, dispatch] = useReducer(cartReducer, {
    ...initialState,
    storeId: initialStoreId,
  });

  const setStore = useCallback((storeId) => {
    dispatch({ type: 'SET_STORE', storeId });
  }, []);

  const addItem = useCallback((item) => {
    if (!item.barcode || !item.name || typeof item.price !== 'number') {
      console.warn('useCart.addItem: Invalid item - requires barcode, name, and price');
      return false;
    }
    dispatch({ type: 'ADD_ITEM', item });
    return true;
  }, []);

  const removeItem = useCallback((barcode) => {
    dispatch({ type: 'REMOVE_ITEM', barcode });
  }, []);

  const updateQuantity = useCallback((barcode, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', barcode, quantity });
  }, []);

  const increment = useCallback((barcode) => {
    dispatch({ type: 'INCREMENT', barcode });
  }, []);

  const decrement = useCallback((barcode) => {
    dispatch({ type: 'DECREMENT', barcode });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Computed values
  const itemCount = useMemo(() => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [state.items]);

  const subtotal = useMemo(() => {
    return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [state.items]);

  // Round to 2 decimal places
  const total = useMemo(() => {
    return Math.round(subtotal * 100) / 100;
  }, [subtotal]);

  const isEmpty = state.items.length === 0;

  const getItem = useCallback(
    (barcode) => {
      return state.items.find((item) => item.barcode === barcode) || null;
    },
    [state.items]
  );

  const hasItem = useCallback(
    (barcode) => {
      return state.items.some((item) => item.barcode === barcode);
    },
    [state.items]
  );

  return useMemo(
    () => ({
      // State
      items: state.items,
      storeId: state.storeId,
      itemCount,
      subtotal,
      total,
      isEmpty,

      // Actions
      setStore,
      addItem,
      removeItem,
      updateQuantity,
      increment,
      decrement,
      clear,
      reset,

      // Queries
      getItem,
      hasItem,
    }),
    [
      state.items,
      state.storeId,
      itemCount,
      subtotal,
      total,
      isEmpty,
      setStore,
      addItem,
      removeItem,
      updateQuantity,
      increment,
      decrement,
      clear,
      reset,
      getItem,
      hasItem,
    ]
  );
};

export default useCart;
