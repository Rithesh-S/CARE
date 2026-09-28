const fs = require('fs');
const path = require('path');

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.avif': 'image/avif',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.jfif': 'image/jpeg',
  '.ico': 'image/x-icon'
};

/**
 * Process ML response directly without mapping to artificial names or sentences.
 */
function processMlPredictions(predictedClasses = [], caption = '') {
  const classes = Array.isArray(predictedClasses) ? predictedClasses : [];
  
  // Directly use predicted class(es) without mapping to a new name
  const ai_issue_type = classes.length > 0 ? classes.join(', ') : 'unclassified';

  return {
    ai_issue_type,
    ai_critical_score: 5,
    is_confusing_critic: classes.length > 2,
    ai_predicted_classes: classes,
    ai_caption: caption || '',
    confidence: 0.95
  };
}

/**
 * Invokes the Visual AI ML Model (/predict) with multipart/form-data.
 * Returns raw predicted_classes and caption directly.
 * 
 * @param {Object} params
 * @param {string} params.imagePath - Path to stored image on disk
 * @param {string} [params.description] - Student text description
 * @param {string} [params.zone] - Campus zone
 */
async function analyzeImage({ imagePath, description = '', zone = '' }) {
  const vlmUrl = process.env.VLM_API_URL || 'http://10.153.245.155:8000';

  if (vlmUrl && vlmUrl !== 'mock' && imagePath && fs.existsSync(imagePath)) {
    const endpoint = vlmUrl.endsWith('/predict') ? vlmUrl : `${vlmUrl}/predict`;
    
    try {
      console.log(`[AI Service] Forwarding to ML Model at: ${endpoint}`);
      
      const fileBuffer = fs.readFileSync(imagePath);
      const filename = path.basename(imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      const mimeType = MIME_MAP[ext] || 'image/jpeg';
      
      const blob = new Blob([fileBuffer], { type: mimeType });
      const formData = new FormData();
      formData.append('file', blob, filename);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[AI Service] Raw ML Response received:', data);
        
        // Exact ML response format: { predicted_classes: [...], caption: "..." }
        const { predicted_classes, caption } = data;
        const processed = processMlPredictions(predicted_classes, caption);
        return {
          ...processed,
          source: 'ml_model_live'
        };
      } else {
        console.warn(`[AI Service] ML Model returned status ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.warn(`[AI Service] ML Model call failed (${endpoint}): ${err.message}. Using fallback.`);
    }
  }

  // --- Fallback if ML endpoint is offline ---
  const lowerDesc = (description || '').toLowerCase();
  let fallbackClasses = ['general_incident'];
  let fallbackCaption = 'Incident recorded on campus premises.';

  if (lowerDesc.includes('water') || lowerDesc.includes('leak') || lowerDesc.includes('drain')) {
    fallbackClasses = ['water_stagnation'];
    fallbackCaption = 'An image showing water stagnation.';
  } else if (lowerDesc.includes('electric') || lowerDesc.includes('wire') || lowerDesc.includes('shock')) {
    fallbackClasses = ['electrical_hazard'];
    fallbackCaption = 'An image showing electrical hazard.';
  } else if (lowerDesc.includes('garbage') || lowerDesc.includes('trash') || lowerDesc.includes('waste')) {
    fallbackClasses = ['garbage'];
    fallbackCaption = 'An image showing garbage.';
  } else if (lowerDesc.includes('bench') || lowerDesc.includes('chair') || lowerDesc.includes('desk')) {
    fallbackClasses = ['broken_furniture'];
    fallbackCaption = 'An image showing broken furniture.';
  }

  return {
    ai_issue_type: fallbackClasses.join(', '),
    ai_critical_score: 5,
    is_confusing_critic: false,
    ai_predicted_classes: fallbackClasses,
    ai_caption: fallbackCaption,
    confidence: 0.85,
    source: 'fallback'
  };
}

module.exports = {
  analyzeImage,
  processMlPredictions
};
