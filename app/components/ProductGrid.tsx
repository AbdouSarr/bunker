import ProductGridCard from '~/components/ProductGridCard';
import type {Product3DDataFragment} from '~/lib/fragments';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

interface ProductGridProps {
  products: Product3DDataFragment[];
  cart: Promise<CartApiQueryFragment | null>;
}

export default function ProductGrid({products}: ProductGridProps) {
  return (
    <section id="products" className="w-full bg-white py-12 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Product Count */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-normal uppercase tracking-wider text-black">
            READY-TO-WEAR
          </h2>
          <span className="text-xs uppercase tracking-wider text-black">
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </span>
        </div>

        {/* Product Grid - Exact Balenciaga layout with borders - 4 columns on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-l border-t border-black">
          {products.map((product) => (
            <ProductGridCard key={product.id} product={product} />
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
    </section>
  );
}
