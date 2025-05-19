// src/controllers/ThreadController.js
const ThreadService = require('../services/ThreadService');
const response = require('../utils/response');
const { getContext } = require('../utils/requestContext');

class ThreadController {
    constructor() {
        this.threadService = new ThreadService();

    }



}

module.exports = new ThreadController();
