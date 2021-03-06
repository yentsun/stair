const winston = require('winston');
const screenPassword = require('./screenPassword');


module.exports = function (id) {
    const formatter = function (options) {
        return [options.timestamp(), 'stair.' + id, options.level.toUpperCase(), options.message || '', options.meta && Object.keys(options.meta).length ? JSON.stringify(options.meta) : ''].join(' ')
    };

    return new (winston.Logger)({
        rewriters: [screenPassword],
        transports: [
            new (winston.transports.Console)({
                level: process.env.LOG_LEVEL || 'debug',
                timestamp: function () {
                    const now = new Date();
                    return now.toISOString()
                },
                formatter,
                stderrLevels: ['error']
            })
        ]
    })
};
