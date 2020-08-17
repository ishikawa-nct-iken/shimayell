'use strict';

const auth = require('basic-auth');

const admins = {
    //'username': { password: 'password' },
};

admins[process.env.WEBHOOK_USERNAME] = { password: process.env.WEBHOOK_PASSWORD };

module.exports = (request, response, next) => {
    const user = auth(request);
    if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
        response.set('WWW-Authenticate', 'Basic realm="example"');
        return response.status(401).send();
    }
    return next();
};
