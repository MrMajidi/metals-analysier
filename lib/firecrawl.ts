import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

/**
 * Extracts price from the scraped markdown content
 * Priority:
 * 1. VAT included price (look for "VAT included" near a price)
 * 2. Average price (look for "Average" near a price)
 * 3. Any price with USD/mt pattern
 */
function extractPrice(markdown: string): number | null {
    // Pattern for price followed by USD/mt
    const priceWithUnitRegex = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:\n|\r\n|\s)*USD\/mt/gi;

    // First, try to find VAT included price
    // Look for "VAT included" section and extract the price near it
    const vatSection = markdown.match(/VAT\s+included[\s\S]{0,100}?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:\n|\r\n|\s)*USD\/mt/i);
    if (vatSection && vatSection[1]) {
        const price = parseFloat(vatSection[1].replace(/,/g, ''));
        if (!isNaN(price) && price >= 100 && price <= 10000) {
            return price;
        }
    }

    // Second, try to find Average price
    const avgSection = markdown.match(/(?:Average|Avg)[\s\S]{0,50}?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:\n|\r\n|\s)*USD\/mt/i);
    if (avgSection && avgSection[1]) {
        const price = parseFloat(avgSection[1].replace(/,/g, ''));
        if (!isNaN(price) && price >= 100 && price <= 10000) {
            return price;
        }
    }

    // Third, find all prices with USD/mt and return the first valid one
    const allPrices: number[] = [];
    let match;
    while ((match = priceWithUnitRegex.exec(markdown)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(price) && price >= 100 && price <= 10000) {
            allPrices.push(price);
        }
    }

    if (allPrices.length > 0) {
        return allPrices[0];
    }

    // Fallback: look for any decimal number that looks like a price (between 100 and 10000)
    const fallbackRegex = /(\d{3,4}(?:\.\d{1,2})?)/g;
    const matches = markdown.match(fallbackRegex);

    if (matches) {
        for (const m of matches) {
            const value = parseFloat(m);
            if (value >= 100 && value <= 10000) {
                return value;
            }
        }
    }

    return null;
}

export async function scrapePrice(url: string): Promise<{ price: number | null; rawMarkdown: string | null; error: string | null }> {
    try {
        const result = await firecrawl.scrape(url, {
            formats: ['markdown'],
        });

        // The scrape method returns the document directly
        const markdown = result.markdown || '';

        if (!markdown) {
            return { price: null, rawMarkdown: null, error: 'No content returned from page' };
        }

        const price = extractPrice(markdown);

        return { price, rawMarkdown: markdown, error: null };
    } catch (error) {
        console.error('Firecrawl error:', error);
        return {
            price: null,
            rawMarkdown: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
