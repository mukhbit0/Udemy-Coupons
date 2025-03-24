const express = require('express');
const compression = require('compression');
const { handleEndpoint } = require('./utils/functions');
const { getCouponscorpionCoupon } = require('./utils/functions');
const { getUdemyCoupon } = require('./utils/functions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());

// Main listing endpoints (no coupon fetching)
app.get('/udemy', (req, res) => handleEndpoint(req, res, 
  `https://www.udemyfreebies.com/free-udemy-courses/${req.query.page || 1}`
));

app.get('/udemy/search/:query', (req, res) => handleEndpoint(req, res, 
  `https://www.udemyfreebies.com/search/${encodeURIComponent(req.params.query)}/${req.query.page || 1}`
));

app.get('/corpion', (req, res) => handleEndpoint(req, res, 
  `https://couponscorpion.com/page/${req.query.page || 1}/`, true
));

app.get('/corpion/search/:query', (req, res) => handleEndpoint(req, res, 
  `https://couponscorpion.com/page/${req.query.page || 1}/?s=${encodeURIComponent(req.params.query)}&post_type=post`, true
));

// Direct coupon endpoints
app.get('/coupon/udemy/:id', async (req, res) => {
  const detailUrl = `https://www.udemyfreebies.com/free-udemy-course/${req.params.id}`;
  try {
    const couponInfo = await getUdemyCoupon(detailUrl);
    res.json({
      success: !!couponInfo?.couponUrl,
      couponUrl: couponInfo?.couponUrl || null,
      price: couponInfo?.price || null,
      expired: !couponInfo?.couponUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/coupon/corpion/*', async (req, res) => {
  const detailUrl = `https://couponscorpion.com/${req.params[0]}/`;
  try {
    const couponInfo = await getCouponscorpionCoupon(detailUrl);
    res.json({
      success: !!couponInfo?.couponUrl,
      couponUrl: couponInfo?.couponUrl || null,
      price: couponInfo?.price || null,
      expired: !couponInfo?.couponUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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