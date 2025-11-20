import {useState, useEffect} from 'react';
import {
  getSavedItems,
  saveItem,
  removeItem,
  isItemSaved,
  type SavedProduct,
} from '~/lib/savedItems';

export function useSavedItems() {
  const [savedItems, setSavedItems] = useState<SavedProduct[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setSavedItems(getSavedItems());
  }, []);

  const addItem = (product: SavedProduct) => {
    saveItem(product);
    setSavedItems(getSavedItems());
  };

  const removeSavedItem = (productId: string) => {
    removeItem(productId);
    setSavedItems(getSavedItems());
  };

  const checkIfSaved = (productId: string) => {
    return isItemSaved(productId);
  };

  return {
    savedItems,
    addItem,
    removeSavedItem,
    checkIfSaved,
    isClient,
  };
}

