import { fetchCategoryBySlug, fetchPostsByCategory } from '@/lib/directus/fetchers';
import DirectusImage from '@/components/shared/DirectusImage';
import Posts from '@/components/blocks/Posts';
import type { Category, Post } from '@/types/directus-schema';

export default async function CategoryPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ preview?: string; token?: string }>;
}) {
	const { slug } = await params;
	const { preview, token } = await searchParams;

	const isDraft = preview === 'true' && !!token;

	try {
		const category: Category = await fetchCategoryBySlug(slug);
		const posts: Post[] = await fetchPostsByCategory(category.id.toString(), { draft: isDraft, token: token });

		if (!category) {
			return <div className="text-center text-xl mt-[20%]">404 - Category Not Found</div>;
		}

		const thumbnailId =
			typeof category.thumbnail === 'string'
				? category.thumbnail
				: category.thumbnail?.id;

		return (
			<div>
				{/* Category Hero Section */}
				<div className="relative w-full h-64 md:h-80 flex items-end justify-start mb-8">
					{thumbnailId && (
						<DirectusImage
							uuid={thumbnailId}
							alt={category.name}
							fill
							className="absolute inset-0 size-full object-cover z-0"
							sizes="100vw"
							priority
						/>
					)}
					<div className="absolute inset-0 bg-black/50 z-10" />
					<div className="relative z-20 p-6 md:p-10">
						<h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg bg-black/60 rounded px-4 py-2 inline-block">
							{category.name}
						</h1>
					</div>
				</div>

				{/* Posts Block */}
				<Posts
					data={{
						id: category.id,
						posts,
						limit: posts.length,
					}}
				/>
			</div>
		);
	} catch (error) {
		console.error('Error loading category page:', error);

		return <div className="text-center text-xl mt-[20%]">404 - Category Not Found</div>;
	}
}