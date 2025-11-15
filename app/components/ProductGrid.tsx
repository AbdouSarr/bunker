import ProductGridCard from '~/components/ProductGridCard';
import type {Product3DDataFragment} from '~/lib/fragments';
import type {CartApiQueryFragment} from '@shopify/hydrogen';

interface ProductGridProps {
  products: Product3DDataFragment[];
  cart: Promise<CartApiQueryFragment | null>;
}

export default function ProductGrid({products}: ProductGridProps) {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Optional Header */}
        <div className="mb-12 md:mb-16">
          <h2 className="font-mono text-3xl md:text-4xl font-normal uppercase tracking-wider text-black">
            Shop All
          </h2>
        </div>

        {/* Product Grid - 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-black">
          {products.map((product) => (
            <ProductGridCard key={product.id} product={product} />
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="font-mono text-gray-500 uppercase tracking-wide">
              No products found
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
