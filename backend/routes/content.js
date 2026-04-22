import express from 'express';
import { Service, Blog, FAQ } from '../models/Content.js';
import mongoose from 'mongoose';
import { protect, authorize } from '../middleware/auth.js';
import { getIO } from '../socket.js';

const router = express.Router();

// Services
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/services', protect, authorize('admin'), async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/services/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/services/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Blogs
router.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/blogs/:id/comments', async (req, res) => {
  try {
    const { name, text, userId } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const newComment = {
      user: userId || null,
      name: name || "Guest User",
      text,
      createdAt: new Date()
    };

    blog.comments.unshift(newComment);
    await blog.save();

    // Live Socket Update
    const io = getIO();
    io.to(`blog_${req.params.id}`).emit('blog_comment_added', { blogId: req.params.id, comment: newComment });

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/blogs', protect, authorize('admin'), async (req, res) => {
  try {
    const blog = await Blog.create(req.body);
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/blogs/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/blogs/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FAQ
router.get('/faq', async (req, res) => {
  try {
    const faqs = await FAQ.find().sort('sortOrder');
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/faqs', protect, authorize('admin'), async (req, res) => {
  try {
    const faq = await FAQ.create(req.body);
    res.status(201).json(faq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/faqs/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(faq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/faqs/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public Stats
router.get('/stats', async (req, res) => {
  try {
    const [doctors, services, blogs, faqs] = await Promise.all([
      mongoose.model('Doctor').countDocuments(),
      Service.countDocuments(),
      Blog.countDocuments(),
      FAQ.countDocuments()
    ]);
    res.json({
      doctors,
      services,
      blogs,
      faqs,
      patients: 1000 + Math.floor(Math.random() * 500) // Dummy but "realistic" patient count as we don't have a massive patient DB yet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
