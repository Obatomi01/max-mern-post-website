const fs = require('fs');
const path = require('path');
const {
  validationResult
} = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');
exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find().countDocuments().then(result => {
    totalItems = result;
    return Post.find().skip((currentPage - 1) * perPage).limit(perPage).populate('creator', 'name');
  }).then(posts => {
    res.status(200).json({
      posts: posts,
      totalItems: totalItems,
      message: 'Fetched Posts'
    });
  }).catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};
exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
    // return res.status(422).json({
    //   message: 'Validation Failed, entered data is incorrect',
    //   errors: errors.array(),
    // });
  }

  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace('\\', '/');
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  console.log(req.userId);
  const post = new Post({
    title: title,
    content: content,
    creator: req.userId,
    imageUrl: imageUrl // this imageUrl can have a prefix of '../' because when it is extracted, it will create some errors
  });

  console.log(post);
  post.save().then(result => {
    console.log('Got here');
    return User.findById(req.userId);
  }).then(user => {
    console.log('create post', user);
    creator = user;
    user.posts.push(post);
    return user.save();
  }).then(result => {
    res.status(201).json({
      message: 'Post created successfully',
      post: post,
      creator: {
        _id: creator._id,
        name: creator.name
      }
    });
  }).catch(err => {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};
exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId).then(post => {
    if (!post) {
      const error = new Error("Couldn't find post");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: 'Post fetched',
      post: post
    });
  }).catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};
exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
    // return res.status(422).json({
    //   message: 'Validation Failed, entered data is incorrect',
    //   errors: errors.array(),
    // });
  }

  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/');
  }
  if (!imageUrl) {
    const error = new Error('No file picked');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId).then(post => {
    if (!post) {
      const error = new Error("Couldn't find post");
      error.statusCode = 404;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    return post.save();
  }).then(result => res.status(200).json({
    post: result,
    message: 'Post updated!'
  })).catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};
exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId).then(post => {
    if (!post) {
      const error = new Error("Couldn't find post");
      error.statusCode = 404;
      throw error;
    }
    clearImage(post.imageUrl);
    return Post.findByIdAndRemove(postId);
  }).then(result => {
    console.log(result);
    res.status(200).json({
      message: 'Post Deleted'
    });
  }).catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};
const clearImage = filePath => {
  const file = path.join(__dirname, '..', filePath);
  fs.unlink(file, err => console.log(err));
};