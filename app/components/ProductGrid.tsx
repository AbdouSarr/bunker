import {useState} from 'react';
import ProductGridCard from '~/components/ProductGridCard';
import {ProductModal} from '~/components/ProductModal';
import type {Product3DDataFragment} from '~/lib/fragments';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

interface ProductGridProps {
  products: Product3DDataFragment[];
  cart: Promise<CartApiQueryFragment | null>;
}

export default function ProductGrid({products}: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product3DDataFragment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductClick = (product: Product3DDataFragment) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <section id="products" className="w-full bg-white overflow-x-hidden">
      <div className="w-full px-0 max-w-full overflow-x-hidden">
        {/* Product Count */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 md:px-6">
          <p className="text-xs uppercase tracking-wider text-black" style={{fontWeight: 'normal'}}>
            READY-TO-WEAR
          </p>
          <p className="text-xs uppercase tracking-wider text-black">
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </p>
        </div>

        {/* Product Grid - Exact Balenciaga layout with borders - 4 columns on desktop */}
        <div className="product-grid-custom border-l border-t border-black w-full max-w-full" style={{borderWidth: '1px'}}>
          {products.map((product) => (
            <ProductGridCard
              key={product.id}
              product={product}
              onProductClick={handleProductClick}
            />
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm uppercase tracking-wider text-gray-500">
              No products found
            </p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}
