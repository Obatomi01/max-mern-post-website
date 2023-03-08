const express = require('express');
const {
  body
} = require('express-validator');
const feedControllers = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');
const router = express.Router();

// GET '/feed/posts'
router.get('/posts', feedControllers.getPosts);
router.post('/post', [body('title').trim().isLength({
  min: 5
}), body('content').trim().isLength({
  min: 5
})], feedControllers.createPost);
router.get('/post/:postId', feedControllers.getPost);
router.put('/post/:postId', [body('title').trim().isLength({
  min: 5
}), body('content').trim().isLength({
  min: 5
})], feedControllers.updatePost);
router.delete('/post/:postId', feedControllers.deletePost);
module.exports = router;