# Yahoo Finance News Scraper

A TypeScript-based web scraper that extracts news articles from Yahoo Finance across multiple topics. The scraper uses Puppeteer for browser automation and handles multiple news topics concurrently.

## Features

-   Scrapes news articles from multiple Yahoo Finance topics
-   Extracts article titles, URLs, and full content
-   Configurable topics, selectors, and delay settings
-   Built-in error handling and logging
-   Written in TypeScript with full type safety
-   Respects rate limiting with configurable delays

## Prerequisites

-   Node.js (v18 or higher)
-   npm or pnpm
-   TypeScript

## Installation

1. Clone the repository:

```bash
git clone https://github.com/frhaanaziz/yahoo-finance-scraper.git
cd yahoo-finance-scraper
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the project:

```bash
pnpm build
```

## Usage

To run the scraper:

```bash
pnpm start
```

### Configuration

The scraper can be configured by modifying the `config` object in `index.ts`:

```typescript
const config: ScraperConfig = {
    topics: [
        'crypto',
        'tech',
        'earnings',
        // ... other topics
    ],
    baseUrl: 'https://finance.yahoo.com/topic',
    userAgent: '...',
    selectors: {
        newsList: 'ul.My\\(0\\) > li.js-stream-content',
        newsTitle: 'h3 > a',
        articleContent: '.body > p, ...',
    },
    delays: {
        betweenArticles: 2000,
        pageLoad: 30000,
    },
};
```

### Customization

You can customize the following aspects:

-   Topics to scrape
-   User agent string
-   CSS selectors for different elements
-   Delay timings between requests
-   Page load timeouts

## Project Structure

```
yahoo-finance-scraper/
├── index.ts
├── build/
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

## Types

The project includes TypeScript interfaces for type safety:

```typescript
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
```

## Error Handling

The scraper includes comprehensive error handling:

-   Custom `NewsScraperError` class for specific error cases
-   Detailed error logging with stack traces
-   Graceful failure handling for individual articles
-   Automatic browser cleanup on errors

## Best Practices

When using this scraper:

-   Respect Yahoo Finance's robots.txt and terms of service
-   Implement appropriate delays between requests
-   Handle rate limiting and blocking gracefully
-   Store scraped data responsibly
-   Keep user agent strings up to date

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Farhan Aziz

## Disclaimer

This scraper is for educational purposes only. Be sure to review and comply with Yahoo Finance's terms of service and robots.txt before using this scraper. The author is not responsible for any misuse of this tool.
