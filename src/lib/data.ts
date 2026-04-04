export interface SitemapUrl {
    path: string;
    priority: number;
    type: 'product' | 'blog' | 'collection' | 'page' | 'home';
}

const BASE_URL = 'https://superyou.in';

export const parseSitemapXml = (xmlText: string): SitemapUrl[] => {
    const urls: SitemapUrl[] = [];
    const urlMatches = xmlText.matchAll(/<url>([\s\S]*?)<\/url>/g);

    for (const match of urlMatches) {
        const content = match[1];
        const locMatch = content.match(/<loc>(.*?)<\/loc>/);
        const priorityMatch = content.match(/<priority>(.*?)<\/priority>/);

        if (locMatch) {
            const fullUrl = locMatch[1];
            const path = fullUrl.replace(BASE_URL, '').trim() || '/';
            // Ensure path starts with / if not root
            const formattedPath = path.startsWith('/') ? path : '/' + path;
            const priority = priorityMatch ? parseFloat(priorityMatch[1]) : 0.5;

            let type: SitemapUrl['type'] = 'page';
            if (formattedPath === '/') type = 'home';
            else if (formattedPath.startsWith('/products/')) type = 'product';
            else if (formattedPath.startsWith('/blogs/')) type = 'blog';
            else if (formattedPath.startsWith('/collections/')) type = 'collection';

            urls.push({ path: formattedPath, priority, type });
        }
    }

    return urls;
};

export const getSitemapData = async (): Promise<SitemapUrl[]> => {
    try {
        const response = await fetch('/sitemap.xml');
        if (!response.ok) {
            throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
        }
        const xmlText = await response.text();
        return parseSitemapXml(xmlText);
    } catch (error) {
        console.error('Error fetching sitemap:', error);
        return [];
    }
};


export const slugToLabel = (path: string, type: SitemapUrl['type']): string => {
    if (type === 'home') return 'Home';

    const segments = path.split('/');
    let slug = segments[segments.length - 1];

    // Handle empty slug if path ends in /
    if (!slug && segments.length > 1) {
        slug = segments[segments.length - 2];
    }

    if (!slug) return 'Home';

    return slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
};

export const getBaseUrl = () => BASE_URL;
