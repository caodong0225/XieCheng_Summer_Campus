// routes/thread.js
const express = require('express');
const router = express.Router();
const ThreadController = require('../controllers/ThreadController');
const { verifyJWT } = require("../utils/jwt");
const { runInContext } = require('../utils/requestContext');

// 收藏操作
// router.post('/notes/:noteId/collections',
//     verifyJWT,
//     (req, res, next) => {
//         runInContext(req, next);
//     },
//     ThreadController.toggleCollection
// );



module.exports = router;
