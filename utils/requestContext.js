// utils/requestContext.js
const { AsyncLocalStorage } = require('async_hooks');

const context = new AsyncLocalStorage();

module.exports = {
    getContext: () => context.getStore(),
    runInContext: (req, callback) => {
        context.run(new Map(), () => {
            const store = context.getStore();
            store.set('user', req.user);
            callback();
        });
    }
};