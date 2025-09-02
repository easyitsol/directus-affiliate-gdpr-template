import { useEffect, useState } from 'react';
import { fetchCategories } from '@/lib/directus/fetchers';
import DirectusImage from '@/components/shared/DirectusImage';
import { cn } from '@/lib/utils';

import Link from 'next/link';

interface Category {
  name: string;
  slug: string;
  thumbnail: string | null;
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories()
      .then((data) => {
        const mapped = data.map((cat: any) => ({
          name: cat.name,
          slug: cat.slug,
          thumbnail:
            typeof cat.thumbnail === 'string'
              ? cat.thumbnail
              : cat.thumbnail?.id ?? null,
        }));
        setCategories(mapped);

        return mapped;
      })
      .catch(() => setCategories([]));
  }, []);

  return (
    <section className="w-full mx-auto flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="block"
            tabIndex={0}
          >
            <div
              className={cn(
                'relative group rounded-2xl overflow-hidden shadow-lg min-h-[220px] flex items-end justify-center transition-transform duration-300',
                'hover:scale-105 hover:shadow-2xl'
              )}
              style={{ aspectRatio: '1/1' }}
            >
              {cat.thumbnail && (
                <DirectusImage
                  uuid={cat.thumbnail}
                  alt={cat.name}
                  fill
                  className="object-cover size-full absolute inset-0 z-0 transition-transform duration-300 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10" />
              <div className="relative z-20 w-full flex justify-center">
                <span className="px-4 py-2 bg-black/60 rounded-lg text-white text-lg font-semibold backdrop-blur-sm transition-colors duration-300 group-hover:bg-black/80">
                   <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}