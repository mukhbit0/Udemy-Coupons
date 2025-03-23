# Udemy Coupons API

A Node.js API that discovers active Udemy coupon links from multiple sources. **Educational project only** - use responsibly.

## ⚠️ Disclaimer

**Important Notice:**  
This project is not affiliated with or endorsed by Udemy. It is provided for educational purposes only. Users are responsible for:

- Respecting Udemy's terms of service
- Verifying coupon validity before use
- Not using this for commercial purposes
- Adhering to website robots.txt rules

Web scraping may violate some websites' terms of service. Use at your own risk.

## Features

- 🔗 **Coupon Discovery**: Finds active Udemy coupon URLs
- 📆 **Course Metadata**: Includes price, ratings, and enrollment data
- 🔍 **Multi-Source Support**: 
  - Browse coupons from multiple providers
  - Search across all sources
- ⚡ **Caching**: 15-minute response caching
- 🛡️ **Anti-Blocking**: Rotating user agents and request delays

## Tech Stack

- Express.js
- Cheerio (HTML parsing)
- Axios (HTTP client)
- Memory-cache
- Compression
- Request rotation system

## API Endpoints

| Endpoint | Parameters | Description |
|----------|------------|-------------|
| `GET /courses` | `page` | UdemyFreebies.com coupons |
| `GET /search/:query` | `query`, `page` | Search UdemyFreebies |
| `GET /coupon` | `page` | CouponsCorpion.com coupons |
| `GET /coupon/search/:query` | `query`, `page` | Search CouponsCorpion |

## Response Structure
```json
{
  "success": true,
  "currentPage": 1,
  "results": [
    {
      "title": "Complete Python Bootcamp",
      "date": "2023-12-01",
      "couponUrl": "https://www.udemy.com/...?couponCode=LEARNFREE",
      "price": "$0",
      "expired": false,
      "details": {
        "category": "Programming",
        "rating": "4.7/5",
        "students": "15,000+"
      }
    }
  ]
}
```

## Ethical Usage Guidelines

1. Add 3-5 second delays between requests
2. Cache responses for at least 1 hour
3. Regularly check robots.txt updates
4. Delete scraped data within 24 hours
5. Monitor website load impact

## Deployment

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

```bash
# Local setup
npm install
NODE_ENV=development npm start
```

**Production Recommendations:**  
```bash
heroku addons:create heroku-redis  # For persistent caching
heroku config:set NODE_ENV=production
```

---

**Note:** Coupon availability and website structures may change unexpectedly. Maintainers not responsible for service disruptions.
