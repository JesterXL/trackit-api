const chai = require('chai')
const { expect } = chai

const {
    getDBClient,
    getPostgresClient,
    getUsers,
    findUser,
    comparePassword,
    login,
    findUserByUsername,
} = require('../../../database/users')

const stubDBClient = {
    connect: ()=> Promise.resolve(),
    query: () => ({
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
    compare: (password, hash) => Promise.resolve(true)
};

describe('database/users', () => {
    describe('getDBClient', ()=> {
        it('should work with good stub', () => {
            const stubClient = function(){}
            const result = getDBClient(stubClient, 'user', 'database', false)
            expect(result).to.exist;
        })
    })
    describe('getPostgresClient', ()=> {
        it('should work with good stub', ()=> {
            const result = getPostgresClient('user', 'database', false);
            expect(result).to.exist;
        })
    })
    describe('getUsers', ()=> {
        it('should work with good stubs', done => {
            getUsers(stubDBClient)
            .then(users => {
                expect(users[0].username).to.equal('someuser');
                done();
            })
            .catch(done);
        })
    })
    describe('findUser', ()=> {
        it('should work with good stubs', done => {
            findUser(stubDBClient, 1)
            .then(user => {
                expect(user.username).to.equal('someuser');
                done();
            })
            .catch(done);
        })
    })
    describe('comparePassword', ()=> {
        it('should work with good stubs', done => {
            comparePassword(stubBCryptModule, 'password', 'hash')
            .then(result => {
                expect(result).to.equal(true);
                done();
            })
            .catch(done);
        })
    })
    describe('login', ()=> {
        it('should work with good stubs', done => {
            login(stubDBClient, stubBCryptModule, 'username', 'password')
            .then(result => {
                expect(result.username).to.equal('someuser');
                done();
            })
            .catch(done);
        })
    })
    describe('findUserByUsername', ()=> {
        it('should work with good stubs', done => {
            findUserByUsername(stubDBClient, 'someuser')
            .then(result => {
                expect(result.username).to.equal('someuser');
                done();
            })
            .catch(done);
        })
    })
})