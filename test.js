const {assert} = require('chai');
const Stair = require('./');


describe('stair', () => {

    const stair = new Stair({
        id: 'alpha'
    });

    before((done) => {
        stair.on('connect', () => {
            done();
        });
    });

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