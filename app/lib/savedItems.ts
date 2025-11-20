// Saved Items utility for managing wishlist/saved products
// Uses localStorage for client-side persistence

export interface SavedProduct {
  id: string;
  title: string;
  handle: string;
  imageUrl: string;
  price: string;
  currencyCode: string;
  variantId?: string;
}

const SAVED_ITEMS_KEY = 'bunker_saved_items';

export function getSavedItems(): SavedProduct[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(SAVED_ITEMS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error reading saved items:', error);
    return [];
  }
}

export function saveItem(product: SavedProduct): void {
  if (typeof window === 'undefined') return;
  
  try {
    const saved = getSavedItems();
    const exists = saved.some(item => item.id === product.id);
    
    if (!exists) {
      saved.push(product);
      localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(saved));
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('savedItemsChanged'));
    }
  } catch (error) {
    console.error('Error saving item:', error);
  }
}

export function removeItem(productId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const saved = getSavedItems();
    const filtered = saved.filter(item => item.id !== productId);
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(filtered));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('savedItemsChanged'));
  } catch (error) {
    console.error('Error removing item:', error);
  }
}

export function isItemSaved(productId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const saved = getSavedItems();
  return saved.some(item => item.id === productId);
}

export function clearSavedItems(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SAVED_ITEMS_KEY);
  } catch (error) {
    console.error('Error clearing saved items:', error);
  }
}

