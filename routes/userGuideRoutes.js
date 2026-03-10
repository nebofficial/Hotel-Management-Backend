const express = require('express');
const {
  getGuides,
  getTutorials,
  getFaqs,
  getDocuments,
  searchTopics,
  getDocumentById,
} = require('../utils/documentationService');

const router = express.Router();

router.get('/guides', (req, res) => {
  try {
    res.json(getGuides());
  } catch (error) {
    console.error('userGuide.guides error:', error);
    res.status(500).json({ message: 'Failed to load guides', error: error.message });
  }
});

router.get('/tutorials', (req, res) => {
  try {
    res.json({ items: getTutorials() });
  } catch (error) {
    console.error('userGuide.tutorials error:', error);
    res.status(500).json({ message: 'Failed to load tutorials', error: error.message });
  }
});

router.get('/faqs', (req, res) => {
  try {
    res.json({ items: getFaqs() });
  } catch (error) {
    console.error('userGuide.faqs error:', error);
    res.status(500).json({ message: 'Failed to load FAQs', error: error.message });
  }
});

router.get('/documents', (req, res) => {
  try {
    res.json({ items: getDocuments() });
  } catch (error) {
    console.error('userGuide.documents error:', error);
    res.status(500).json({ message: 'Failed to load documents', error: error.message });
  }
});

router.get('/search', (req, res) => {
  try {
    const q = req.query.q || req.query.query || '';
    const items = searchTopics(String(q || ''));
    res.json({ items });
  } catch (error) {
    console.error('userGuide.search error:', error);
    res.status(500).json({ message: 'Failed to search help topics', error: error.message });
  }
});

router.get('/download/:id', (req, res) => {
  try {
    const doc = getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    // For now we just return metadata + URL, real file hosting can be added later.
    res.json({ document: doc });
  } catch (error) {
    console.error('userGuide.download error:', error);
    res.status(500).json({ message: 'Failed to fetch documentation link', error: error.message });
  }
});

module.exports = router;

