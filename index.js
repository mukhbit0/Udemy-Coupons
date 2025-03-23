const express = require('express');
const compression = require('compression');
const { handleEndpoint } = require('./utils/functions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());

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