const {assert} = require('chai');
const Stair = require('./');
const sinon = require('sinon');
const TRID = require('trid');


describe('stair', () => {

    describe('connected()', () => {

        const stair = new Stair({
            id: 'beta'
        });

        before(async () => {
            await stair.connected();
        });

        it('is connected', (done) => {
            assert.isOk(stair._stan.clientID);
            done();
        });

        after((done) => {
            stair.close();
            done();
        });

    });

    describe('general', () => {

        const stair = new Stair({
            id: 'alpha'
        });

        const trid = new TRID({prefix: 's'});

        // TODO investigate this failing tests
        // before((done) => {
        //     stair.on('connect', () => {
        //         done();
        //     });
        // });

        after((done) => {
            stair.close();
            done()
        });

        describe('write', () => {

            const id = trid.seq();

            it('returns a guid', async () => {
                const guid = await stair.write(id, {foo: 'bar'});
                assert.isOk(guid);
            });

        });

        describe('read', () => {


            it('reads an event with default subscription options', async () => {
                const id = trid.seq();
                await stair.read(id, (message, handled) => {
                    assert.equal(message.foo, id);
                    handled();
                });
                stair.write(id, {foo: id});
            });

            it('reads an event with custom subscription options', async () => {
                const id = trid.seq();
                await stair.write(id, {foo: id});
                const opts = stair.subopts();
                // see https://github.com/nats-io/node-nats-streaming#subscription-start-ie-replay-options
                opts.setStartWithLastReceived();
                await stair.read(id, opts, (message, handled) => {
                    assert.equal(message.foo, id);
                    handled();
                });
            })

        });

        describe('stan error event', () => {

            it('emits error too', (done) => {
                stair.on('error', (error) => {
                    assert.equal(error.message, 'synthetic error');
                    done();
                });
                try {
                    const error = new Error('synthetic error');
                    stair._stan.emit('error', error);
                } catch (error) {}

            });

            it('exits on connection error', (done) => {
                const sandbox = sinon.sandbox.create({useFakeTimers : true});
                const exitStub  = sandbox.stub(process, 'exit');
                const error = new Error('synthetic connection error');
                error.code = 'CONN_ERR';
                stair._stan.emit('error', error);
                sinon.assert.calledOnce(exitStub);
                sandbox.restore();
                done();
            })
        });

        describe('connection events', () => {

            it('handles connect', (done) => {
                assert.equal(stair._state, 'connected');
                done();
            });

            it('handles reconnecting', (done) => {
                stair._stan.emit('reconnecting');
                assert.equal(stair._state, 'reconnecting');
                done();
            });

            it('handles reconnect', (done) => {
                stair._stan.emit('close');
                assert.equal(stair._state, 'closed');
                done();
            });
        });
    });

});