const chai = require('chai')
const { expect } = chai
const {
    getHMAC,
    getRandomNumber,
    generateToken
} = require('../../../tokens');

const cryptoStub = {
    createHmac: ()=> ({
        update: ()=> ({
            digest: ()=> true
        })
    })
};
const randomNumberStub = () => 1

describe('tokens/index.js', () => {
    describe('getHMAC', ()=> {
        it('works with good stubs', ()=> {
            const result = getHMAC(cryptoStub, 1, 'data');
            expect(result).to.equal(true);
        })
    })
    describe('getRandomNumber', ()=> {
        it('works with good stubs', ()=> {
            const result = getRandomNumber(randomNumberStub)
            expect(result).to.equal(1)
        })
    })
    describe('generateToken', ()=> {
        it('works with good stubs', done => {
            const result = generateToken(
                cryptoStub, 
                ()=> Promise.resolve(1),
                ()=> true,
                'data'
            );
            result.then(result => {
                expect(result).to.equal(true);
                done();
            })
            .catch(done);
        })
    })
})




