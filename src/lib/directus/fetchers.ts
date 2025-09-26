import { BlockPost, PageBlock, Post, Redirect, Schema, ProductList, Product, ProductLink } from '@/types/directus-schema';
import { useDirectus } from './directus';
import { readItems, aggregate, readItem, readSingleton, withToken, QueryFilter } from '@directus/sdk';
import { RedirectError } from '../redirects';
import { Category } from '../../types/directus-schema';

/**
 * Fetches page data by permalink, including all nested blocks and dynamically fetching blog posts if required.
 */
export const fetchPageData = async (permalink: string, postPage = 1) => {
	const { directus, readItems } = useDirectus();
	try {
		const pageData = await directus.request(
			readItems('pages', {
				filter: { permalink: { _eq: permalink } },
				limit: 1,
				fields: [
					'title',
					'seo',
					'id',
					{
						blocks: [
							'id',
							'background',
							'collection',
							'item',
							'sort',
							'hide_block',
							{
								item: {
									block_richtext: ['id', 'tagline', 'headline', 'content', 'alignment'],
									block_gallery: ['id', 'tagline', 'headline', { items: ['id', 'directus_file', 'sort'] as any }],
									block_pricing: [
										'id',
										'tagline',
										'headline',
										{
											pricing_cards: [
												'id',
												'title',
												'description',
												'price',
												'badge',
												'features',
												'is_highlighted',
												{
													button: [
														'id',
														'label',
														'variant',
														'url',
														'type',
														{ page: ['permalink'] },
														{ post: ['slug'] },
													],
												},
											],
										},
									],
									block_hero: [
										'id',
										'tagline',
										'headline',
										'description',
										'layout',
										'image',
										{
											button_group: [
												'id',
												{
													buttons: [
														'id',
														'label',
														'variant',
														'url',
														'type',
														{ page: ['permalink'] },
														{ post: ['slug'] },
													],
												},
											],
										},
									],
									block_posts: ['id', 'tagline', 'headline', 'collection', 'limit'],
									block_form: [
										'id',
										'tagline',
										'headline',
										{
											form: [
												'id',
												'title',
												'submit_label',
												'success_message',
												'on_success',
												'success_redirect_url',
												'is_active',
												{
													fields: [
														'id',
														'name',
														'type',
														'label',
														'placeholder',
														'help',
														'validation',
														'width',
														'choices',
														'required',
														'sort',
													],
												},
											],
										},
									],
									block_category_grid: [
										'id',
										'tagline',
										'headline',
									],
									block_comparison_table: [
										'id',
										'tagline',
										'headline',
										'items',
									],
								},
							},
						],
					},
				],
				deep: {
					blocks: { _sort: ['sort'], _filter: { hide_block: { _neq: true } } },
				},
			}),
		);

		if (!pageData.length) {
			throw new Error('Page not found');
		}

		const page = pageData[0];

		if (Array.isArray(page.blocks)) {
			for (const block of page.blocks as PageBlock[]) {
				if (
					block.collection === 'block_posts' &&
					typeof block.item === 'object' &&
					(block.item as BlockPost).collection === 'posts'
				) {
					const limit = (block.item as BlockPost).limit ?? 6;
					const posts = await directus.request<Post[]>(
						readItems('posts', {
							fields: ['id', 'title', 'description', 'slug', 'image', 'status', 'published_at'],
							filter: { status: { _eq: 'published' } },
							sort: ['-published_at'],
							limit,
							page: postPage,
						}),
					);

					(block.item as BlockPost & { posts: Post[] }).posts = posts;
				}
			}
		}

		return page;
	} catch (error) {
		console.error('Error fetching page data:', error);
		throw new Error('Failed to fetch page data');
	}
};

/**
 * Fetches global site data, header navigation, and footer navigation.
 */
export const fetchSiteData = async () => {
	const { directus } = useDirectus();

	try {
		const [globals, headerNavigation, footerNavigation] = await Promise.all([
			directus.request(
				readSingleton('globals', {
					fields: ['id', 'title', 'description', 'logo', 'logo_dark_mode', 'social_links', 'accent_color', 'favicon', 'cookiebot_id', 'matomo_id'],
				}),
			),
			directus.request(
				readItem('navigation', 'main', {
					fields: [
						'id',
						'title',
						{
							items: [
								'id',
								'title',
								{
									page: ['permalink'],
									children: ['id', 'title', 'url', { page: ['permalink'] }],
								},
							],
						},
					],
					deep: { items: { _sort: ['sort'] } },
				}),
			),
			directus.request(
				readItem('navigation', 'footer', {
					fields: [
						'id',
						'title',
						{
							items: [
								'id',
								'title',
								{
									page: ['permalink'],
									children: ['id', 'title', 'url', { page: ['permalink'] }],
								},
							],
						},
					],
				}),
			),
		]);

		return { globals, headerNavigation, footerNavigation };
	} catch (error) {
		console.error('Error fetching site data:', error);
		throw new Error('Failed to fetch site data');
	}
};

/**
 * Fetches a single blog post by slug and related blog posts excluding the given ID. Handles live preview mode.
 */
export const fetchPostBySlug = async (
	slug: string,
	options?: { draft?: boolean; token?: string },
): Promise<{ post: Post | null; relatedPosts: Post[] }> => {
	const { directus } = useDirectus();
	const { draft, token } = options || {};

	try {
		const filter: QueryFilter<Schema, Post> = options?.draft
			? { slug: { _eq: slug } }
			: { slug: { _eq: slug }, status: { _eq: 'published' } };
		let postRequest = readItems<Schema, 'posts', any>('posts', {
			filter,
			limit: 1,
			fields: [
				'id',
				'title',
				'content',
				'status',
				'published_at',
				'image',
				'description',
				'slug',
				'seo',
				'Kategorie',
				{
					productList: ['id', 'status', 'category', {
						products: ['id', 'name', 'description', 'price', 'image', 'deeplink', 'value', {
							productLinks: ['id', 'url', 'price', 'date_updated'],
						}],
					}]
				},
				{
					author: ['id', 'first_name', 'last_name', 'avatar'],
				},
			],
		});

		// This is a really naive implementation of related posts. Just a basic check to ensure we don't return the same post. You might want to do something more sophisticated.
		let relatedRequest = readItems<Schema, 'posts', any>('posts', {
			filter: { slug: { _neq: slug }, status: { _eq: 'published' } },
			limit: 2,
			fields: ['id', 'title', 'slug', 'image'],
		});

		if (draft && token) {
			postRequest = withToken(token, postRequest);
			relatedRequest = withToken(token, relatedRequest);
		}

		const [posts, relatedPosts] = await Promise.all([
			directus.request<Post[]>(postRequest),
			directus.request<Post[]>(relatedRequest),
		]);

		const post: Post | null = posts.length > 0 ? (posts[0] as Post) : null;
		if (post?.productList) {
			const products = await directus.request(readItems('products', {
				filter: { productList: { _eq: post.productList.id } },
			}));
			post.productList.products = products;
		}

		return { post, relatedPosts };
	} catch (error) {
		console.error('Error in fetchPostBySlug:', error);
		throw new Error('Failed to fetch blog post and related posts');
	}
};

/**
 * Fetches paginated blog posts.
 */
export const fetchPaginatedPosts = async (limit: number, page: number) => {
	const { directus } = useDirectus();
	try {
		const response = await directus.request(
			readItems('posts', {
				limit,
				page,
				sort: ['-published_at'],
				fields: ['id', 'title', 'description', 'slug', 'image'],
				filter: { status: { _eq: 'published' } },
			}),
		);

		return response;
	} catch (error) {
		console.error('Error fetching paginated posts:', error);
		throw new Error('Failed to fetch paginated posts');
	}
};

/**
 * Fetches the total number of published blog posts.
 */
export const fetchTotalPostCount = async (): Promise<number> => {
	const { directus } = useDirectus();

	try {
		const response = await directus.request(
			aggregate('posts', {
				aggregate: { count: '*' },
				filter: { status: { _eq: 'published' } },
			}),
		);

		return Number(response[0]?.count) || 0;
	} catch (error) {
		console.error('Error fetching total post count:', error);

		return 0;
	}
};

export async function fetchRedirects(): Promise<Pick<Redirect, 'url_from' | 'url_to' | 'response_code'>[]> {
	const { directus } = useDirectus();
	const response = await directus.request(
		readItems('redirects', {
			filter: {
				_and: [
					{
						url_from: { _nnull: true },
					},
					{
						url_to: { _nnull: true },
					},
				],
			},
			fields: ['url_from', 'url_to', 'response_code'],
		}),
	);

	return response || [];
}

export const fetchProductLists = async (category: string): Promise<ProductList[]> => {
	const { directus } = useDirectus();
	try {
		const response = await directus.request(
			readItems('productLists', {
				fields: ['id', 'status', 'category' /**{
					products: ['id', 'name', 'description', 'price', 'image', 'deeplink', 'value', {
						productLinks: ['id', 'url', 'price', 'date_updated'],
					}],
				}*/],
				filter: { category: {_eq: category} }
			})
		);

		const productList = response as ProductList[];
		
		const publishedProductLists = productList.filter(pl => pl.status === 'published');
		const updatedProductLists = await Promise.all(
			publishedProductLists.map(async pl => {
				const products = await directus.request(
					readItems('products', {
						filter: { productList: { _eq: pl.id } },
					}),
				);
				
				return { ...pl, products };
			}),
		);
		
		return updatedProductLists as ProductList[];
	} catch (error) {
		console.error('Error fetching productLists:', error);
		throw new Error('Failed to fetch productLists');
	}
};

/**
 * Fetches all categories with name, slug, and thumbnail.
 */
export const fetchCategories = async (options?: { draft?: boolean; token?: string }): Promise<Category[]> => {
	const { directus } = useDirectus();
	const { draft, token } = options || {};
	try {
		if (draft && token) {
			const response = await directus.request<Category[]>(
				withToken(token,
					readItems('categories', {
						fields: ['id','name', 'slug', 'thumbnail'],
					})
				)
			);

			return response;
		}

		return await directus.request<Category[]>(
			readItems('categories', {
				fields: ['id','name', 'slug', 'thumbnail'],
			})
		);
	} catch (error) {
		console.error('Error fetching categories:', error);
		throw new Error('Failed to fetch categories');
	}
};
/**
 * Fetches all posts assigned to a given category (by Kategorie field).
 * @param {string} category - The category name to filter by (exact match).
 */
export const fetchPostsByCategory = async (category: string, options?: { draft?: boolean; token?: string },): Promise<Post[]> => {
  const { directus } = useDirectus();
	const { draft, token } = options || {};
  try {
		let postsByCat = readItems<Schema, 'posts', any>('posts', {
			filter: { Kategorie: { _eq: parseInt(category) }, status: { _eq: 'published' } },
			fields: [
				'id',
				'title',
				'description',
				'slug',
				'image',
				'Kategorie',
				'published_at',
				'author',
			],
			sort: ['-published_at'],
		});
		if (draft && token) {
			postsByCat = withToken(token, postsByCat);
		}

    const response = await directus.request<Post []>(
      postsByCat
    );

    return response;
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    throw new Error('Failed to fetch posts by category');
  }
};

/**
 * Fetches a single category by slug.
 */
export const fetchCategoryBySlug = async (
  slug: string
): Promise<any | null> => {
  const { directus } = useDirectus();
  try {
    const response = await directus.request(
      readItems('categories', {
        filter: { slug: { _eq: slug } },
        limit: 1,
        fields: ['id', 'name', 'slug', 'thumbnail'],
      })
    );

    return response.length > 0 ? response[0] : null;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    throw new Error('Failed to fetch category by slug');
  }
};

export const fetchProducts = async (productListId: string): Promise<Product[]> => {
	const { directus } = useDirectus();
	try {
		const response = await directus.request(
			readItems('products', {
				filter: { productList: { _eq: productListId } }
			})
		);

		return response as Product[];
	} catch (error) {
		console.error('Error fetching products:', error);
		throw new Error('Failed to fetch products');
	}
};

export const fetchProductLinks = async (productId: string): Promise<ProductLink[]> => {
	const { directus } = useDirectus();
	try {
		const response = await directus.request(
			readItems('productLinks', {
				filter: { product: { _eq: productId } },
				fields: ['*'], // TODO: Replace with specific fields for better performance
			})
		);

		return response as ProductLink[];
	} catch (error) {
		console.error('Error fetching productLists:', error);
		throw new Error('Failed to fetch productLists');
	}
};