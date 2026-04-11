import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getFAQs, createFAQ, updateFAQ, deleteFAQ,
  getBlogs, createBlog, updateBlog, deleteBlog
} from '../controllers/adminController.js';

const router = express.Router();

// Public routes for reading
router.get('/faqs', getFAQs);
router.get('/blogs', getBlogs);

// Protected Admin routes
router.use(protect);
router.use(authorize('admin'));

router.post('/faqs', createFAQ);
router.put('/faqs/:id', updateFAQ);
router.delete('/faqs/:id', deleteFAQ);

router.post('/blogs', createBlog);
router.put('/blogs/:id', updateBlog);
router.delete('/blogs/:id', deleteBlog);

export default router;
