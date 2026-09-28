/**
 * AI VLM (Visual Language Model) Service
 * Re-exports from aiService.js for backward-compatibility
 */

const aiService = require('./aiService');

module.exports = {
  ...aiService
};
