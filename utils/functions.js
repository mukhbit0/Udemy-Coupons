const axios = require('axios');
const cheerio = require('cheerio');
const cache = require('memory-cache');
const async = require('async');
const URLSearchParams = require('url').URLSearchParams;

const CACHE_DURATION = 15 * 60 * 1000;
const COURSE_CACHE_PREFIX = 'courses_';
const COUPON_CACHE_PREFIX = 'coupon_';
const TIMEOUT = 28000;

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];

let cookieStore = '';
let currentUserAgent = userAgents[0];

async function fetchData(url, isCouponscorpion = false) {
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

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

    const PROXY = process.env.PROXY;
    const axiosConfig = {
      headers,
      timeout: 15000,
      validateStatus: () => true,
      maxRedirects: 5
    };

    if (PROXY) {
      axiosConfig.proxy = {
        protocol: 'http',
        host: PROXY.split('@')[1].split(':')[0],
        port: parseInt(PROXY.split(':').pop())
      };
    }

    const response = await axios.get(url, axiosConfig);

    if (response.headers['set-cookie']) {
      cookieStore = response.headers['set-cookie'].join('; ');
    }

    currentUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    cache.put(url, response.data, CACHE_DURATION);
    return response.data;
  } catch (error) {
    console.error(`Fetch Error: ${error.message}`);
    throw error;
  }
}

function extractUdemyFreebiesCourses($) {
  const courses = [];
  $('.theme-block').each((i, el) => {
    const $el = $(el);
    const priceText = $el.find('.fa-money').parent().text().trim();

    if (!/free/i.test(priceText)) return;

    const course = {
      date: $el.find('small.text-muted').first().text().trim(),
      title: $el.find('.coupon-name h4').text().trim(),
      category: $el.find('.coupon-specility p').text().trim(),
      details: {
        language: $el.find("i.fa-comment").parent().text().replace("English", "").trim(),
        instructor: $el.find("i.fa-user").parent().text().replace("Filip Flego", "").trim(),
        rating: $el.find("i.fa-star").parent().text().replace("Rate:", "").trim(),
        students: $el.find("i.fa-users").parent().text().replace("Enroll:", "").trim(),
        originalPrice: priceText.match(/\$\d+/)?.[0] || 'Free'
      },
      detailUrl: $el.find('.coupon-details a[href]').attr('href')
    };

    if (course.title) courses.push(course);
  });

  return courses;
}

function extractCouponscorpionCourses($, isSearch = false) {
  const courses = [];
  const selector = isSearch ? '.news-community' : '.eq_grid.pt5 .col_item.offer_grid';

  $(selector).each((i, el) => {
    const $el = $(el);
    
    if (isSearch) {
      const title = $el.find('h2 a').text().trim();
      const date = $el.find('.date_meta').text().trim();
      const category = $el.find('.cat_link_meta a').first().text().trim() || 'Development'; // Fallback category
      const detailUrl = $el.find('h2 a').attr('href');
      const discount = '100% OFF'; // Search results always show 100% off

      if (title) {
        courses.push({
          title,
          date,
          category,
          detailUrl,
          discount
        });
      }
    } else {
      const title = $el.find('h3 a').text().trim();
      const date = $el.find('.date_ago').text().replace('ago', '').trim();
      const discount = $el.find('.grid_onsale').text().trim();
      const category = $el.find('.cat_link_meta a').first().text().trim();
      const detailUrl = $el.find('h3 a').attr('href');

      if (title && discount.includes('100%')) {
        courses.push({ title, date, discount, category, detailUrl });
      }
    }
  });

  return courses;
}

async function getCouponscorpionCoupon(detailUrl) {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const data = await fetchData(detailUrl, true);
    const $ = cheerio.load(data);

    const couponButton = $('.disablemobileborder .btn_offer_block');
    if (!couponButton.length) return null;

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

async function getUdemyCoupon(detailUrl) {
  const cachedCoupon = cache.get(COUPON_CACHE_PREFIX + detailUrl);
  if (cachedCoupon) return cachedCoupon;

  try {
    const data = await fetchData(detailUrl);
    const $ = cheerio.load(data);

    const price = $('.fa-money').parent().text().match(/\$\d+/)?.[0] || 'Free';

    const couponLink = $('a.button-icon[href^="https://www.udemyfreebies.com/out/"]');
    if (!couponLink.length) return null;

    const formData = new URLSearchParams();
    formData.append('security_check', '1');

    const response = await axios.post(couponLink.attr('href'), formData, {
      headers: {
        'User-Agent': currentUserAgent,
        'Referer': detailUrl,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      maxRedirects: 5,
      validateStatus: null
    });

    const finalUrl = response.request.res.responseUrl;

    const result = {
      couponUrl: finalUrl,
      price: price
    };

    cache.put(COUPON_CACHE_PREFIX + detailUrl, result, CACHE_DURATION);
    return result;
  } catch (error) {
    console.error('Udemy Coupon Error:', error.message);
    return null;
  }
}

async function handleEndpoint(req, res, url, isCouponscorpion = false) {
  const cacheKey = `${isCouponscorpion ? 'cscorp_' : ''}${COURSE_CACHE_PREFIX}${url}${req.params.query || ''}`;
  const cachedResults = cache.get(cacheKey);

  if (cachedResults) {
    return res.json({ ...cachedResults, cached: true });
  }

  try {
    const html = await fetchData(url, isCouponscorpion);
    const $ = cheerio.load(html);

    if (isCouponscorpion && url.includes('?s=')) {
      isSearch = true;
    }

    const courses = isCouponscorpion ? 
      extractCouponscorpionCourses($, isSearch) : 
      extractUdemyFreebiesCourses($);

    // Fix course ID generation for CouponScorpion
    const results = courses.map(course => ({
      ...course,
      id: isCouponscorpion ? 
        course.detailUrl.replace('https://couponscorpion.com/', '').replace(/\/$/, '') :
        course.detailUrl.split('/').pop()
    }));

    const response = {
      success: true,
      currentPage: req.query.page || 1,
      results: results
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

module.exports = {
  fetchData,
  extractUdemyFreebiesCourses,
  extractCouponscorpionCourses,
  getCouponscorpionCoupon,
  getUdemyCoupon,
  handleEndpoint
};
