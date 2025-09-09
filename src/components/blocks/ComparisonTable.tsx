import React, { useEffect, useState } from 'react';
import { fetchProductLists, fetchCategories } from '@/lib/directus/fetchers';
import type { ProductList, Product, Category, ProductLink } from '@/types/directus-schema';
import Tagline from '../ui/Tagline';
import Headline from '../ui/Headline';
import Button from './Button';
import { setAttr } from '@directus/visual-editing';
import Link from 'next/link';
import Image from 'next/image';

export interface ComparisonTableData {
	id: string;
	tagline?: string;
	headline?: string;
	items?: ProductList[];
}

interface ComparisonTableProps {
	data: ComparisonTableData;
}

/**
 * ComparisonTable component
 * Fetches product lists from Directus and displays them in a comparison table.
 * 
 * NOTE: Update the ProductList interface in directus-schema.ts with actual fields for best results.
 */
const ComparisonTable = ({data}: ComparisonTableProps) => {
  const { tagline, headline, items, id } = data;
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!items) {
    // Fetch categories on mount
    useEffect(() => {
      const fetchCats = async () => {
        setLoadingCategories(true);
        setError(null);
        try {
          const cats = await fetchCategories();
          setCategories(cats);
          if (cats.length > 0) {
            setSelectedCategory(cats[0]);
          }
        } catch (err: any) {
          setError(err.message || 'Fehler beim Laden der Kategorien.');
        } finally {
          setLoadingCategories(false);
        }
      };
      fetchCats();
    }, []);

    // Fetch product lists when selectedCategory changes
    useEffect(() => {
      if (!selectedCategory) return;
      const fetchProducts = async () => {
        setLoadingProducts(true);
        setError(null);
        try {
          const lists = await fetchProductLists(selectedCategory.id);
          setProductLists(lists);
        } catch (err: any) {
          setError(err.message || 'Fehler beim Laden der Produktlisten.');
          setProductLists([]);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchProducts();
    }, [selectedCategory]);
  } else {
    setProductLists(items);
  }

  // Find the latest product list (by id or date, fallback to last)
  const latestProductList: ProductList | null =
    productLists && productLists.length > 0
      ? productLists[productLists.length - 1]
      : null;

  // Helper to get products array
  const products: Product[] =
    latestProductList && Array.isArray(latestProductList.products)
      ? (latestProductList.products as Product[])
      : [];

  if (loadingCategories) {
    return <div>Lade Kategorien...</div>;
  }

  if (error) {
    return <div className="text-red-600">Fehler: {error}</div>;
  }

  if (!items && (!categories || categories.length === 0)) {
    return <div>Keine Kategorien gefunden.</div>;
  }

  return (
    <section className="w-full max-w-5xl px-4 py-12 md:py-20">
      {tagline && (
				<Tagline
					tagline={tagline}
					data-directus={setAttr({
						collection: 'block_comparison_table',
						item: id,
						fields: 'tagline',
						mode: 'popover',
					})}
				/>
			)}
			{headline && (
				<Headline
					headline={headline}
					data-directus={setAttr({
						collection: 'block_comparison_table',
						item: id,
						fields: 'headline',
						mode: 'popover',
					})}
				/>
			)}
      {!items && categories && categories.length > 0 &&
        <div className="flex flex-wrap gap-2 my-8">
          {categories.map((cat) => (
            <Button
              id={`cat-${cat.id}`}
              label={cat.name}
              key={cat.name}
              variant={selectedCategory?.name === cat.name ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              disabled={loadingProducts && selectedCategory?.name === cat.name}
            />
          ))}
        </div>
      }
      {/* Table */}
      {/* Mobile Card View */}
      <div className="block md:hidden">
        {loadingProducts ? (
          <div className="text-center py-8">Lade Produkte...</div>
        ) : !latestProductList || products.length === 0 ? (
          <div className="text-center py-8">Keine Produkte gefunden.</div>
        ) : (
          <div className="space-y-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg shadow p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  {product.image ? (
                    typeof product.image === 'string' ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        className="size-16 object-cover rounded"
                        width={64}
                        height={64}
                      />
                    ) : product.image?.id ? (
                      <Image
                        src={`/assets/${product.image.id}`}
                        alt={product.name}
                        className="size-16 object-cover rounded"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <span className="size-16 flex items-center justify-center bg-gray-100 rounded text-gray-400">—</span>
                    )
                  ) : (
                    <span className="size-16 flex items-center justify-center bg-gray-100 rounded text-gray-400">—</span>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <div className="text-sm text-gray-500">{product.value || '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 mb-1">Beschreibung</div>
                  <div className="text-gray-600 text-sm">
                    {product.description ? product.description.substring(0, 200) + (product.description.length > 200 ? '...' : '') : '—'}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 mb-1">Stärken</div>
                  <div className="text-gray-600 text-sm">{product.value || '—'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 mb-1">Affiliate-Links</div>
                  {Array.isArray(product.productLinks) && product.productLinks.length > 0 ? (
                    <ul className="space-y-1">
                      {(product.productLinks as ProductLink[]).map((link) =>
                        typeof link === 'object' && link.url ? (
                          <li key={link.id}>
                            <Link
                              href={link.url}
                              target="_blank"
                              rel="sponsored nofollow noopener noreferrer"
                              className="underline"
                            >
                              {link.price ? `${link.price} € bei ` : ''}
                              {link.shop ? `${link.shop}` : 'Zum Shop'}
                              **
                            </Link>
                          </li>
                        ) : null
                      )}
                    </ul>
                  ) : (
                    <span>
                      <Link
                        href={product.deeplink || '#'}
                        target="_blank"
                        rel="sponsored nofollow noopener noreferrer"
                        className="underline"
                      >
                        {product.price ? `${product.price} € bei ` : ''}
                        {product.shop ? `${product.shop}` : 'Zum Shop'}
                        **
                      </Link>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        {loadingProducts ? (
          <div className="text-center py-8">Lade Produkte...</div>
        ) : !latestProductList || products.length === 0 ? (
          <div className="text-center py-8">Keine Produkte gefunden.</div>
        ) : (
          <table className="min-w-full ring-offset-background border border-gray-200 rounded-lg shadow">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Beschreibung</th>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Bild</th>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Stärken</th>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Affiliate-Links</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-400">
                  <td className="px-6 py-4 border-b">{product.name}</td>
                  <td className="px-6 py-4 border-b">{product.description ? product.description?.substring(0, 100) + '...' : '—'}</td>
                  <td className="px-6 py-4 border-b">
                    {product.image ? (
                      typeof product.image === 'string' ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          className="size-12 object-cover rounded"
                          width={64}
                          height={64}
                        />
                      ) : product.image?.id ? (
                        <Image
                          src={`/assets/${product.image.id}`}
                          alt={product.name}
                          className="size-12 object-cover rounded"
                          width={64}
                          height={64}
                        />
                      ) : (
                        <span>—</span>
                      )
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 border-b">{product.value || '—'}</td>
                  <td className="px-6 py-4 border-b">
                    {Array.isArray(product.productLinks) && product.productLinks.length > 0 ? (
                      <ul className="space-y-1">
                        {(product.productLinks as ProductLink[]).map((link) =>
                          typeof link === 'object' && link.url ? (
                            <li key={link.id}>
                              <Link
                                href={link.url}
                                target="_blank"
                                rel="sponsored nofollow noopener noreferrer"
                                className= "underline"
                              >
                                 {link.price ? `${link.price} € bei ` : ''}
                                {link.shop ? `${link.shop}` : 'Zum Shop'}
                                **
                              </Link>
                            </li>
                          ) : null
                        )}
                      </ul>
                    ) : (
                      <span>
                      <Link
                        href={product.deeplink || '#'}
                        target="_blank"
                        rel="sponsored nofollow noopener noreferrer"
                        className= "underline"
                      >
                        {product.price ? `${product.price} € bei ` : ''}
                        {product.shop ? `${product.shop}` : 'Zum Shop'}
                        **
                      </Link></span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-4">** Affiliate-Link: Wenn du über diesen Link kaufst, erhalten wir eine kleine Provision ohne zusätzliche Kosten für dich. Vielen Dank für deine Unterstützung!</p>
    </section>
  );
};

export default ComparisonTable;
