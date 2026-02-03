
/**
 * News Service
 * Fetches relevant industry news for the live ticker.
 */

export interface NewsItem {
    title: string;
    source: string;
    url?: string;
}

const FALLBACK_NEWS: NewsItem[] = [
    { title: "Kenya Copyright Board (KECOBO) updates digital royalty frameworks for 2025.", source: "KECOBO" },
    { title: "KFCB signals revision of licensing for independent Nairobi creators.", source: "KFCB" },
    { title: "Kalasha Awards nominations window closing soon.", source: "Kalasha" },
    { title: "MCSK announces quarterly distribution schedule.", source: "MCSK" },
    { title: "Netflix expanding local investment in East African original titles.", source: "Netflix" },
    { title: "High Court sets precedent on AI-generated copyright in Kenya.", source: "Legal Trend" }
];

export const newsService = {
    /**
     * Fetches the latest news headlines.
     * In a production environment, this could call an Edge Function that scrapes 
     * or fetches RSS feeds to bypass CORS.
     */
    async fetchLatestNews(): Promise<NewsItem[]> {
        try {
            // For now, we simulate a fetch. 
            // In a real implementation, we could fetch from a Supabase table updated by an agent
            // or use a public feed parser API.

            const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.musicbusinessworldwide.com/feed/');

            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    return data.items.slice(0, 10).map((item: any) => ({
                        title: item.title,
                        source: 'MBW',
                        url: item.link
                    }));
                }
            }

            return FALLBACK_NEWS;
        } catch (error) {
            console.error("News Fetch Error:", error);
            return FALLBACK_NEWS;
        }
    }
};
