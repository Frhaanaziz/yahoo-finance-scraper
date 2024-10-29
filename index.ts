import puppeteer, { Browser, Page } from 'puppeteer';
import { URL } from 'url';

// Types
interface NewsItem {
    title: string;
    detailUrl: string;
    content?: string;
}

interface ScraperConfig {
    topics: string[];
    baseUrl: string;
    userAgent: string;
    selectors: {
        newsList: string;
        newsTitle: string;
        articleContent: string;
    };
    delays: {
        betweenArticles: number;
        pageLoad: number;
    };
}

// Configuration
const config: ScraperConfig = {
    topics: [
        'crypto',
        'tech',
        'earnings',
        'housing-market',
        'economic-news',
        'morning-brief',
        'yahoo-finance-originals',
        'stock-market-news',
    ],
    baseUrl: 'https://finance.yahoo.com/topic',
    userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    selectors: {
        newsList: 'ul.My\\(0\\) > li.js-stream-content',
        newsTitle: 'h3 > a',
        articleContent:
            '.body > p, .body > h1, .body > h2, .body > h3, .body > h4, .body > h5, .body > h6, .caas-body > p, .caas-body > h1, .caas-body > h2, .caas-body > h3, .caas-body > h4, .caas-body > h5, .caas-body > h6',
    },
    delays: {
        betweenArticles: 2000,
        pageLoad: 30000,
    },
};

// Utility functions
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const logger = {
    info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
    error: (message: string, error: Error) => console.error(`[ERROR] ${message}:`, error.stack),
};

class NewsScraperError extends Error {
    constructor(message: string, public readonly context?: any) {
        super(message);
        this.name = 'NewsScraperError';
    }
}

// Core scraping functionality
class NewsScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;

    constructor(private readonly config: ScraperConfig) {}

    async initialize(): Promise<void> {
        try {
            this.browser = await puppeteer.launch({
                // headless: 'shell',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            this.page = await this.browser.newPage();
            await this.page.setUserAgent(this.config.userAgent);
        } catch (error) {
            throw new NewsScraperError('Failed to initialize scraper', error);
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }

    private async getArticleContent(url: string): Promise<string> {
        if (!this.browser) {
            throw new NewsScraperError('Browser not initialized');
        }

        const page = await this.browser.newPage();
        try {
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: this.config.delays.pageLoad,
            });

            const content = await page.evaluate((selector) => {
                const elements = document.querySelectorAll(selector);
                return Array.from(elements)
                    .map((el) => el.outerHTML)
                    .join('\n');
            }, this.config.selectors.articleContent);

            return content;
        } catch (error) {
            throw new NewsScraperError(`Failed to fetch article content: ${url}`, error);
        } finally {
            await page.close();
        }
    }

    private async scrapeNewsItems(): Promise<NewsItem[]> {
        if (!this.page) {
            throw new NewsScraperError('Page not initialized');
        }

        try {
            return await this.page.$$eval(
                this.config.selectors.newsList,
                (items, titleSelector) =>
                    items.map((item) => {
                        const titleElement = item.querySelector<HTMLAnchorElement>(titleSelector);
                        if (!titleElement?.href || !titleElement?.innerText) {
                            throw new Error('Invalid news item structure');
                        }

                        return {
                            title: titleElement.innerText.trim(),
                            detailUrl: titleElement.href,
                        };
                    }),
                this.config.selectors.newsTitle
            );
        } catch (error) {
            throw new NewsScraperError('Failed to scrape news items', error);
        }
    }

    async scrapeTopic(topic: string): Promise<NewsItem[]> {
        if (!this.page) {
            throw new NewsScraperError('Page not initialized');
        }

        try {
            const url = `${this.config.baseUrl}/${topic}`;
            await this.page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: this.config.delays.pageLoad,
            });

            const newsItems = await this.scrapeNewsItems();

            const results: NewsItem[] = [];
            for (const item of newsItems) {
                try {
                    const absoluteUrl = new URL(item.detailUrl, this.page.url()).href;
                    const content = await this.getArticleContent(absoluteUrl);

                    results.push({
                        ...item,
                        detailUrl: absoluteUrl,
                        content,
                    });

                    logger.info(`Scraped article: ${item.title}`);
                    await sleep(this.config.delays.betweenArticles);
                } catch (error) {
                    logger.error(`Failed to process article: ${item.title}`, error as Error);
                }
            }

            return results;
        } catch (error) {
            throw new NewsScraperError(`Failed to scrape topic: ${topic}`, error);
        }
    }

    async scrapeAllTopics(): Promise<Map<string, NewsItem[]>> {
        const results = new Map<string, NewsItem[]>();

        try {
            await this.initialize();

            for (const topic of this.config.topics) {
                logger.info(`Starting to scrape topic: ${topic}`);
                const topicResults = await this.scrapeTopic(topic);
                results.set(topic, topicResults);
                logger.info(`Completed scraping topic: ${topic}`, {
                    articlesCount: topicResults.length,
                });
            }
        } catch (error) {
            logger.error('Failed to complete scraping', error as Error);
            throw error;
        } finally {
            await this.close();
        }

        return results;
    }
}

// Usage example
async function main() {
    const scraper = new NewsScraper(config);
    try {
        const results = await scraper.scrapeAllTopics();

        // Process results
        for (const [topic, items] of results) {
            logger.info(`Topic: ${topic}`, {
                numberOfArticles: items.length,
                articles: items.map((item) => ({
                    title: item.title,
                    url: item.detailUrl,
                })),
            });
        }
    } catch (error) {
        logger.error('Scraping failed', error as Error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { NewsScraper, config, NewsItem, ScraperConfig };
