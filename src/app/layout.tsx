import '@/styles/globals.css';
import '@/styles/fonts.css';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import Script from 'next/script';

import VisualEditingLayout from '@/components/layout/VisualEditingLayout';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { fetchSiteData } from '@/lib/directus/fetchers';
import { getDirectusAssetURL } from '@/lib/directus/directus-utils';

export async function generateMetadata(): Promise<Metadata> {
	const { globals } = await fetchSiteData();

	const siteTitle = globals?.title?.replace('Build your next website faster with our CMS Template | ', '') || 'Simple Affiliate Marketing by Valista';
	const siteDescription = globals?.description || 'A starter Affiliate template powered by Next.js and Valista.';
	const faviconURL = globals?.favicon ? getDirectusAssetURL(globals.favicon) : '/favicon.ico';

	return {
		title: {
			default: siteTitle,
			template: `%s | ${siteTitle}`,
		},
		description: siteDescription,
		icons: {
			icon: faviconURL,
		},
	};
}

export default async function RootLayout({ children }: { children: ReactNode }) {
	const { globals, headerNavigation, footerNavigation } = await fetchSiteData();
	const accentColor = globals?.accent_color || '#6644ff';
	const cookiebotId = globals?.cookiebot_id;
	const matomoId = globals?.matomo_id;

	return (
		<html lang="de" style={{ '--accent-color': accentColor } as React.CSSProperties} suppressHydrationWarning>
			<head>
				{cookiebotId && (
					<Script
						id="Cookiebot"
						src="https://consent.cookiebot.com/uc.js"
						data-cbid={cookiebotId}
						data-blockingmode="auto"
						type="text/javascript"
						strategy="afterInteractive"
					/>
				)}
				{matomoId && (
					<Script id="matomo" strategy="afterInteractive">
						{
							`var _paq = window._paq = window._paq || [];
							_paq.push(['trackPageView']);
							_paq.push(['enableLinkTracking']);
							(function() {
								var u="https://${matomoId}/";
								_paq.push(['setTrackerUrl', u+'matomo.php']);
								_paq.push(['setSiteId', '1']);
								var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
								g.async=true; g.src='https://cdn.matomo.cloud/${matomoId}/matomo.js'; s.parentNode.insertBefore(g,s);
							})();`
						}
					</Script>
				)}
			</head>
			<body className="antialiased font-sans flex flex-col min-h-screen">
				<ThemeProvider>
					<VisualEditingLayout
						headerNavigation={headerNavigation}
						footerNavigation={footerNavigation}
						globals={globals}
					>
						<main className="flex-grow">{children}</main>
					</VisualEditingLayout>
				</ThemeProvider>
			</body>
		</html>
	);
}
