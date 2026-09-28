const express = require('express');
const router = express.Router();
const { analyzeImage } = require('../services/aiService');
const { upload } = require('../middlewares/upload');

// Test endpoint for AI VLM / ML model analysis
router.post('/analyze-mock', upload.single('image'), async (req, res) => {
  try {
    const { description, zone } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const result = await analyzeImage({
      imagePath,
      description,
      zone
    });

    return res.json({
      success: true,
      data: result,
      source: result.source || (process.env.VLM_API_URL && process.env.VLM_API_URL !== 'mock' ? 'external_vlm' : 'mock_vlm')
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get available AI categories
router.get('/categories', (req, res) => {
  return res.json({
    success: true,
    categories: ISSUE_CATEGORIES
  });
});

module.exports = router;
