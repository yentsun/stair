const {assert} = require('chai');
const Stair = require('./');
const sinon = require('sinon');


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

    });

    describe('general', () => {

        const stair = new Stair({
            id: 'alpha'
        });

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

            it('writes an event', (done) => {
                stair.read('foo.bar', (message, handled) => {
                    assert.equal(message.foo, 'bar');
                    handled();
                    done();
                });
                stair.write('foo.bar', {foo: 'bar'});
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