import React, { useEffect, useState } from 'react';
import { fetchProductLists, fetchCategories } from '@/lib/directus/fetchers';
import type { ProductList, Product, Category, ProductLink } from '@/types/directus-schema';

/**
 * ComparisonTable component
 * Fetches product lists from Directus and displays them in a comparison table.
 * 
 * NOTE: Update the ProductList interface in directus-schema.ts with actual fields for best results.
 */
const ComparisonTable: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const lists = await fetchProductLists(selectedCategory.slug);
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

  if (!categories || categories.length === 0) {
    return <div>Keine Kategorien gefunden.</div>;
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-12 md:py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
        Produktvergleich
      </h2>
      {/* Tabs for categories */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`px-4 py-2 rounded ${
              selectedCategory?.id === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            } transition`}
            onClick={() => setSelectedCategory(cat)}
            disabled={loadingProducts && selectedCategory?.id === cat.id}
          >
            {cat.name}
          </button>
        ))}
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        {loadingProducts ? (
          <div className="text-center py-8">Lade Produkte...</div>
        ) : !latestProductList || products.length === 0 ? (
          <div className="text-center py-8">Keine Produkte in dieser Kategorie gefunden.</div>
        ) : (
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Beschreibung</th>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Bild</th>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Wert</th>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Preis</th>
                <th className="px-6 py-3 border-b text-left font-semibold text-gray-700">Links</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b">{product.name}</td>
                  <td className="px-6 py-4 border-b">{product.description || '—'}</td>
                  <td className="px-6 py-4 border-b">
                    {product.image ? (
                      typeof product.image === 'string' ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="size-12 object-cover rounded"
                        />
                      ) : product.image?.id ? (
                        <img
                          src={`/assets/${product.image.id}`}
                          alt={product.name}
                          className="size-12 object-cover rounded"
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
                    {typeof product.price === 'number' ? `${product.price} €` : '—'}
                  </td>
                  <td className="px-6 py-4 border-b">
                    {Array.isArray(product.productLinks) && product.productLinks.length > 0 ? (
                      <ul className="space-y-1">
                        {(product.productLinks as ProductLink[]).map((link) =>
                          typeof link === 'object' && link.url ? (
                            <li key={link.id}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                {link.price ? `${link.price} €` : 'Zum Shop'}
                              </a>
                            </li>
                          ) : null
                        )}
                      </ul>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default ComparisonTable;
