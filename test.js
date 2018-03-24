const {assert} = require('chai');
const Stair = require('./');


describe('stair (empty options)', () => {

    const stair = new Stair();

    before((done) => {
        stair.on('connect', () => {
            done();
        });
    });

    it('runs ok', (done) => {
        assert.isOk(stair._stan.clusterID);
        assert.isOk(stair._stan.clientID);
        done();
    });

    after((done) => {
        stair.close();
        done()
    });

});

describe('stair', () => {

    const stair = new Stair({
        id: 'alpha'
    });

    // TODO investigate why this timeouts
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

    })

});