const chai = require('chai')
const { expect } = chai

const {
    getDBClient,
    getUsers,
    findUser,
    comparePassword,
    login,
    findUserByUsername,
    encryptPassword,
    createUser,
    deleteUser
} = require('../../../database/users')

const stubDBClient = {
    query: () => Promise.resolve({
        rowCount: 1,
        rows: [{
            id: 1,
            username: 'someuser',
            password: 'somepass',
            salt: 'somesalt'
        }]
    })
}
const stubBCryptModule = {
    compare: (password, hash) => Promise.resolve(true),
    genSalt: (saltRounds) => Promise.resolve('generatedsalt'),
    hash: ()=> Promise.resolve('hashed')
};

describe('database/users', () => {
    describe('getDBClient when called', ()=> {
        it('should work with good stub', () => {
            const stubClient = function(){}
            const result = getDBClient(stubClient, 'user', 'database', false)
            expect(result).to.exist;
        })
    })
    describe('getUsers when called', ()=> {
        it('should work with good stubs', done => {
            getUsers(stubDBClient)
            .then(users => {
                expect(users[0].username).to.equal('someuser');
                done();
            })
            .catch(done);
        })
    })
    describe('findUser when called', ()=> {
        it('should work with good stubs', done => {
            findUser(stubDBClient, 1)
            .then(user => {
                expect(user.username).to.equal('someuser');
                done();
            })
            .catch(done);
        })
    })
    describe('comparePassword when called', ()=> {
        it('should work with good stubs', done => {
            comparePassword(stubBCryptModule, 'password', 'hash')
            .then(result => {
                expect(result).to.equal(true);
                done();
            })
            .catch(done);
        })
    })
    describe('login when called', ()=> {
        it('should work with good stubs', done => {
            login(stubBCryptModule, stubDBClient, 'username', 'password')
            .then(result => {
                expect(result.username).to.equal('someuser');
                done();
            })
            .catch(done);
        })
    })
    describe('findUserByUsername when called', ()=> {
        it('should work with good stubs', done => {
            findUserByUsername(stubDBClient, 'someuser')
            .then(result => {
                expect(result.username).to.equal('someuser');
                done();
            })
            .catch(done);
        })
    })
    describe('encryptPassword when called', ()=> {
        it('should work with good stubs', done => {
            encryptPassword(stubBCryptModule, 15, 'password')
            .then(result => {
                console.log("result:", result);
                done();
            })
            .catch(done);
        })
    })
    describe('createUser when called', ()=> {
        it('should work with good stubs', done => {
            createUser(stubBCryptModule, stubDBClient, 15, 'username', 'password', 'email')
            .then(result => {
                expect(result.username).to.equal('someuser');
                done();
            })
            .catch(done);
        })
    })
    describe('deleteUser when called', ()=> {
        it('should work with good stubs', done => {
            deleteUser(stubDBClient, 'username')
            .then(result => {
                console.log("result:", result);
                done();
            })
            .catch(done)
        })
    })
})