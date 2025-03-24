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

### `/api/coupons`

Fetches a list of Udemy course coupons.

#### Query Parameters:
- `url` (required): The URL of the source page to scrape coupons from.
- `isCouponscorpion` (optional): Set to `true` if the source is CouponScorpion. Defaults to `false`.

#### Response:
- `success` (boolean): Indicates if the request was successful.
- `currentPage` (number): The current page of results.
- `results` (array): A list of courses with the following fields:
  - `title` (string): The course title.
  - `date` (string): The date the coupon was posted.
  - `discount` (string): The discount percentage (e.g., "100% OFF").
  - `category` (string): The course category.
  - `detailUrl` (string): The URL to the course details.
  - `id` (string): A unique identifier for the course. For CouponScorpion, this includes the category and slug (e.g., `personal-development/from-novice-to-expert-complete-tour-guide-training-program/`).

#### Example Request:
```bash
GET /api/coupons?url=https://couponscorpion.com/personal-development/&isCouponscorpion=true
```

#### Example Response:
```json
{
  "success": true,
  "currentPage": 1,
  "results": [
    {
      "title": "From Novice to Expert: Complete Tour Guide Training Program",
      "date": "3 minutes",
      "discount": "100% OFF",
      "category": "Personal Development",
      "detailUrl": "https://couponscorpion.com/personal-development/from-novice-to-expert-complete-tour-guide-training-program/",
      "id": "personal-development/from-novice-to-expert-complete-tour-guide-training-program/"
    }
  ]
}
```

### `/api/udemy`

Fetches Udemy course coupons specifically from UdemyFreebies.

#### Query Parameters:
- `url` (required): The URL of the UdemyFreebies page to scrape coupons from.

#### Response:
- Similar to `/api/coupons`, but the `id` is derived from the course slug.

#### Example Request:
```bash
GET /api/udemy?url=https://www.udemyfreebies.com/free-udemy-course/python-for-beginners
```

#### Example Response:
```json
{
  "success": true,
  "currentPage": 1,
  "results": [
    {
      "title": "Python for Beginners",
      "date": "1 hour ago",
      "category": "Programming",
      "detailUrl": "https://www.udemyfreebies.com/free-udemy-course/python-for-beginners",
      "id": "python-for-beginners"
    }
  ]
}
```

### `/coupon/corpion/*`

- **Description**: Fetches coupon details from CouponScorpion.
- **Method**: GET
- **URL Structure**: `/coupon/corpion/<path-to-coupon>`
  - `<path-to-coupon>`: The full path of the coupon on CouponScorpion (e.g., `personal-development/from-novice-to-expert-complete-tour-guide-training-program`).
- **Example**:
  ```
  GET http://localhost:3000/coupon/corpion/personal-development/from-novice-to-expert-complete-tour-guide-training-program/
  ```
- **Response**:
  ```json
  {
    "success": true,
    "couponUrl": "https://example.com/coupon-link",
    "price": "Free",
    "expired": false
  }
  ```

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

## Setup

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Start the server using `npm start`.

## Notes

- Ensure the `PROXY` environment variable is set if using a proxy.
- Cached results are stored for 15 minutes to reduce redundant requests.

---

**Note:** Coupon availability and website structures may change unexpectedly. Maintainers not responsible for service disruptions.

# Udemy Coupons API

This API provides endpoints to fetch Udemy and CouponScorpion coupons.

## Endpoints

### `/udemy`

- **Description**: Fetches a list of free Udemy courses.
- **Method**: GET
- **Query Parameters**:
  - `page` (optional): The page number to fetch. Defaults to `1`.
- **Example**:
  ```
  GET http://localhost:3000/udemy?page=2
  ```

### `/udemy/search/:query`

- **Description**: Searches for Udemy courses by query.
- **Method**: GET
- **Path Parameters**:
  - `query` (required): The search term.
- **Query Parameters**:
  - `page` (optional): The page number to fetch. Defaults to `1`.
- **Example**:
  ```
  GET http://localhost:3000/udemy/search/python?page=1
  ```

### `/corpion`

- **Description**: Fetches a list of coupons from CouponScorpion.
- **Method**: GET
- **Query Parameters**:
  - `page` (optional): The page number to fetch. Defaults to `1`.
- **Example**:
  ```
  GET http://localhost:3000/corpion?page=3
  ```

### `/corpion/search/:query`

- **Description**: Searches for coupons on CouponScorpion by query.
- **Method**: GET
- **Path Parameters**:
  - `query` (required): The search term.
- **Query Parameters**:
  - `page` (optional): The page number to fetch. Defaults to `1`.
- **Example**:
  ```
  GET http://localhost:3000/corpion/search/javascript?page=2
  ```

### `/coupon/udemy/:id`

- **Description**: Fetches details of a specific Udemy coupon.
- **Method**: GET
- **Path Parameters**:
  - `id` (required): The unique identifier of the Udemy course.
- **Example**:
  ```
  GET http://localhost:3000/coupon/udemy/python-for-beginners
  ```

### `/coupon/corpion/*`

- **Description**: Fetches coupon details from CouponScorpion.
- **Method**: GET
- **Path Parameters**:
  - `*` (required): The full path of the coupon on CouponScorpion (e.g., `personal-development/from-novice-to-expert-complete-tour-guide-training-program`).
- **Example**:
  ```
  GET http://localhost:3000/coupon/corpion/personal-development/from-novice-to-expert-complete-tour-guide-training-program/
  ```

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Start the server:
   ```
   npm start
   ```
3. Access the API at `http://localhost:3000`.

## Notes

- Ensure the server is running in the correct environment (`production` or `development`) as needed.
- Use the wildcard route `/coupon/corpion/*` for CouponScorpion coupons with complex paths.
