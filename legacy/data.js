/**
 * Data Loader for IDMS Sitemap
 * Fetches sitemap-superyou.xml and prepares the data structure
 */

const BASE_URL = 'https://superyou.in';
const XML_PATH = './sitemap-superyou.xml';

async function loadSitemapData() {
    try {
        let xmlText;
        if (window.XML_DATA) {
            xmlText = window.XML_DATA;
        } else {
            const response = await fetch(XML_PATH);
            xmlText = await response.text();
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        const urlElements = xmlDoc.getElementsByTagName('url');
        const urls = [];

        for (let i = 0; i < urlElements.length; i++) {
            const loc = urlElements[i].getElementsByTagName('loc')[0]?.textContent;
            const priority = urlElements[i].getElementsByTagName('priority')[0]?.textContent || '0.5';

            if (loc) {
                // Extract relative path from absolute URL
                const path = loc.replace(BASE_URL, '') || '/';
                urls.push({ path, priority: parseFloat(priority) });
            }
        }

        return { urls, baseUrl: BASE_URL };
    } catch (error) {
        console.error('Error loading sitemap XML:', error);
        return { urls: [], baseUrl: BASE_URL };
    }
}

// Export for use in visualizer.js
window.loadSitemapData = loadSitemapData;
