const {EventEmitter} = require('events');
const {PassThrough, Writable} = require('stream');
const merge = require('lodash/merge');
const STAN = require('node-nats-streaming');
const Logger = require('./lib/logger');


module.exports = class extends EventEmitter {

    constructor(options={}) {

        super();
        const defaults = {
            url: 'nats://localhost:4222',
            cluster: 'test-cluster',
            group: 'default',
            id: 'default'
        };
        this._options = merge(defaults, options);
        this._logger = this._options.logger || Logger(this._options.id);
        this._stan = STAN.connect(this._options.cluster, this._options.id, options);
        this._state = null;
        this.readyPromise = new Promise(resolve => {
            this.on('connect', () => {resolve()});
        });

        this._stan.on('connect', () => {
            this._state = 'connected';
            this.emit('connect');
            this._logger.info('connected to cluster:', this._stan.clusterID);
        });

        this._stan.on('close', () => {
            this._state = 'closed';
            this._logger.info('closed');
        });

        this._stan.on('reconnecting', () => {
            this._state = 'reconnecting';
            this._logger.info('reconnecting');
        });

        this._stan.on('reconnect', () => {
            this._state = 'connected';
            this._logger.info('reconnected');
        });

        this._stan.on('error', (error) => {
            this._logger.error(`${error.message}${error.code ? ' (code: '+error.code+')' : ''}`);
            if (error.code === 'CONN_ERR') {
                process.exit(1);
            }
            else
                this.emit('error', error);
        });
    }

    connected() {
        return this.readyPromise;
    }

    write(topic, message) {

        return new Promise((resolve, reject) => {
            this._stan.publish(topic, JSON.stringify(message), (error, guid) => {
                if (error) reject(error);
                else {
                    resolve(guid);
                    this._logger.debug('-->', topic, message, guid);
                }
            });
        });


    }

    read(topic, handler) {

        const opts = this._stan.subscriptionOptions().setDeliverAllAvailable();
        const sub = this._stan.subscribe(topic, this._options.group, opts);
        const queueStream = new PassThrough();
        const storeWritable = new Writable({
            write(data, encoding, done) {
                handler(JSON.parse(data), done);
            }
        });
        queueStream.pipe(storeWritable);
        sub.on('message', (msg) => {
            const msgData = JSON.parse(msg.getData());
            const seq = msg.getSequence();
            this._logger.debug('<--', topic, msgData, seq);
            queueStream.push(JSON.stringify(msgData));
        });
    }

    close() {
        this._stan.close();
    }

};