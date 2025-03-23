const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cache = require('memory-cache');
const compression = require('compression');
const URLSearchParams = require('url').URLSearchParams;

const app = express();
const PORT = process.env.PORT || 3000;

// Cache Configuration
const CACHE_DURATION = 15 * 60 * 1000;
const COURSE_CACHE_PREFIX = 'courses_';
const COUPON_CACHE_PREFIX = 'coupon_';

// Anti-Blocking Configuration
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];

let cookieStore = '';
let currentUserAgent = userAgents[0];

app.use(compression());

// Enhanced Fetch Function
async function fetchData(url, isCouponscorpion = false) {
  const cached = cache.get(url);
  if (cached) return cached;

  try {
    const headers = {
      'User-Agent': currentUserAgent,
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': isCouponscorpion ? 'https://couponscorpion.com/' : 'https://www.udemyfreebies.com/',
      'Cookie': cookieStore,
      'DNT': '1'
    };

    const response = await axios.get(url, {
      headers,
      timeout: 15000,
      validateStatus: () => true,
      maxRedirects: 5
    });

    if (response.headers['set-cookie']) {
      cookieStore = response.headers['set-cookie'].join('; ');
    }

    // Rotate User Agent
    currentUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    cache.put(url, response.data, CACHE_DURATION);
    return response.data;
  } catch (error) {
    console.error(`Fetch Error: ${error.message}`);
    throw error;
  }
}

// Udemy Freebies Functions
function extractUdemyFreebiesCourses($) {
  const courses = [];
  
  $('#coupon-page .col-md-4.col-sm-6 .theme-block').each((i, el) => {
    const $el = $(el);
    const priceText = $el.find('.fa-money').parent().text().trim();
    
    if (!/free$/i.test(priceText)) return;

    const course = {
      date: $el.find('small.text-muted').first().text().trim(),
      title: $el.find('.coupon-name h4').text().trim(),
      category: $el.find('.coupon-specility p').text().trim(),
      details: {
        language: $el.find('.fa-comment').parent().contents().last().text().trim(),
        instructor: $el.find('.fa-user').parent().contents().last().text().trim(),
        rating: $el.find('.fa-star').parent().contents().last().text().replace('Rate:', '').trim(),
        students: $el.find('.fa-users').parent().contents().last().text().replace('Enroll:', '').trim(),
        originalPrice: priceText.match(/\$\d+/)?.[0]
      },
      detailUrl: $el.find('.coupon-details a[href]').attr('href')
    };

    if (course.title) courses.push(course);
  });

  return courses;
}

// Couponscorpion Functions
function extractCouponscorpionCourses($) {
  const courses = [];
  
  $('.eq_grid.pt5 .col_item.offer_grid').each((i, el) => {
    const $el = $(el);
    const title = $el.find('h3 a').text().trim();
    const date = $el.find('.date_ago').text().replace('ago', '').trim();
    const discount = $el.find('.grid_onsale').text().trim();
    const category = $el.find('.cat_link_meta a').first().text().trim();
    const detailUrl = $el.find('h3 a').attr('href');

    if (title && discount.includes('100%')) {
      courses.push({ title, date, discount, category, detailUrl });
    }
  });

  return courses;
}

async function getCouponscorpionCoupon(detailUrl) {
  try {
    // Random delay 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const data = await fetchData(detailUrl, true);
    const $ = cheerio.load(data);
    
    const couponButton = $('.disablemobileborder .btn_offer_block');
    if (!couponButton.length) return null;

    // Use POST request for coupon URL
    const formData = new URLSearchParams();
    formData.append('security', '1');
    
    const response = await axios.post(couponButton.attr('href'), formData, {
      headers: {
        'User-Agent': currentUserAgent,
        'Referer': detailUrl,
        'Cookie': cookieStore
      },
      maxRedirects: 5,
      validateStatus: null
    });

    return {
      couponUrl: response.request.res.responseUrl,
      price: $('.rh_regular_price').first().text().trim() || '$0'
    };
  } catch (error) {
    console.error(`Coupon Error: ${error.message}`);
    return null;
  }
}

// Common Endpoint Handler
async function handleEndpoint(req, res, url, isCouponscorpion = false) {
  const cacheKey = `${isCouponscorpion ? 'cscorp_' : ''}${COURSE_CACHE_PREFIX}${url}`;
  const cachedResults = cache.get(cacheKey);
  if (cachedResults) return res.json(cachedResults);

  try {
    const html = await fetchData(url, isCouponscorpion);
    const $ = cheerio.load(html);

    const courses = isCouponscorpion ? 
      extractCouponscorpionCourses($) : 
      extractUdemyFreebiesCourses($);

    const results = [];
    for (const course of courses) {
      const couponInfo = isCouponscorpion ? 
        await getCouponscorpionCoupon(course.detailUrl) :
        await getUdemyCoupon(course.detailUrl);

      results.push({
        ...course,
        ...couponInfo,
        expired: !couponInfo?.couponUrl
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    }

    const response = {
      success: true,
      currentPage: req.query.page || 1,
      results: results.filter(c => !c.expired)
    };

    cache.put(cacheKey, response, CACHE_DURATION);
    res.json(response);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Endpoints
app.get('/courses', (req, res) => handleEndpoint(req, res, 
  `https://www.udemyfreebies.com/free-udemy-courses/${req.query.page || 1}`
));

app.get('/search/:query', (req, res) => handleEndpoint(req, res, 
  `https://www.udemyfreebies.com/search/${encodeURIComponent(req.params.query)}/${req.query.page || 1}`
));

app.get('/coupon', (req, res) => handleEndpoint(req, res, 
  `https://couponscorpion.com/page/${req.query.page || 1}/`, true
));

app.get('/coupon/search/:query', (req, res) => handleEndpoint(req, res, 
  `https://couponscorpion.com/?s=${encodeURIComponent(req.params.query)}&post_type=post&paged=${req.query.page || 1}`, true
));

// Production Error Handling
if (process.env.NODE_ENV === 'production') {
  app.use((err, req, res, next) => {
    console.error('Production error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') console.log('Debug mode enabled');
});