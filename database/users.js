const { Client } = require('pg');
const {
    filter,
    head,
    get,
    curryN,
    first
} = require('lodash/fp');
const moment = require('moment');
const bcrypt = require('bcrypt');
const saltRounds = 16;
const DB_USERNAME = 'jessewarden';
const DB_NAME = 'jessewarden';
const SSL = false;

const getDBClient = curryN(4, 
    (clientClass, user, database, ssl) =>
        new clientClass({
            // connectionString: process.env.DATABASE_URL,
            user,
            database,
            ssl,
        }
    )
)

const getPostgresClient = getDBClient(Client);

const getUsers = dbClient =>
    dbClient.connect()
    .then(() => dbClient.query('SELECT username,date FROM users;'))
    .then(result => result.rows)

const findUser = curryN(2, 
    (dbClient, id) =>
        dbClient.connect()
        .then(() => dbClient.query('SELECT id,username FROM users WHERE id = $1;', [id]))
        .then(result => {
            if(result.rowCount > 0) {
                return first(result.rows);
            } else {
                return Promise.reject(new Error(`User id ${id} not found.`));
            }
        })
)

const comparePassword = curryN(3,
    (bycryptModule, password, hash) =>
        bycryptModule.compare(password, hash)
)

const login = curryN(4, 
    (dbClient, bycryptModule, username, password) =>
        dbClient.connect()
        .then(() => dbClient.query('SELECT id,username,password,salt FROM users WHERE username = $1', [username]))
        .then(result => {
            if(result.rowCount > 0) {
                const potentialUser = first(result.rows);
                return comparePassword(bycryptModule, password, potentialUser.salt)
                .then(aMatch => {
                    if(aMatch === true) {
                        return Promise.resolve({
                            id: potentialUser.id,
                            username: potentialUser.username
                        });
                    } else {
                        return Promise.reject(new Error(`Incorrect password.`));
                    }
                });
            } else {
                return Promise.reject(new Error(`User username ${username} and/or password not found.`));
            }
        })
)

const findUserByUsername = curryN(2, 
    (dbClient, username) =>
        client.connect()
        .then(() => client.query('SELECT id,username FROM users WHERE username = $1;', [username]))
        .then(result => {
            if(result.rowCount > 0) {
                return first(result.rows);
            } else {
                return Promise.reject(new Error(`Username ${username} not found.`));
            }
        })
)

const findUserByUsernameAndPassword = curryN(3,
    (dbClient, username, password) =>
        client.connect()
        .then(() => client.query('SELECT id,username FROM users WHERE username = $1 AND password = $2;', [username, password]))
        .then(result => {
            if(result.rowCount > 0) {
                return first(result.rows);
            } else {
                return Promise.reject(new Error(`Username ${username} and password combination not found.`));
            }
        })
)

// INSERT INTO users VALUES ('jesterxl', 'jesse.warden@gmail', 'password', '2018-1-27');
const createUserUnsafe = curryN(5, 
    (dbClient, username, passwordHash, salt, email) => {
        const now = moment(new Date()).format('YYYY-MM-DD');
        return dbClient.query(
            'INSERT INTO users(username, email, salt, password, date) VALUES($1, $2, $3, $4, $5)',
            [username, email, passwordHash, salt, now]
        )
    }
)

const generateSalt = curryN(2,
    (bcryptModule, saltRounds) =>
        bcryptModule.genSalt(saltRounds)
    )

const hashPassword = curryN(3,
    (bcryptModule, password, salt) =>
        bcryptModule.hash(password, salt)
    )

const encryptPassword = curryN(3, 
        (bcryptModule, saltRounds, password) =>
            generateSalt(bcryptModule, saltRounds)
            .then(hashPassword(bycryptModule, password))
)

const createUser = curryN(6,
    (dbClient, bcryptModule, saltRounds, newUsername, newPassword, newEmail) => {
        const usernameMatches = item => get('username', item) === newUsername;
        const emailMatches = item => get('email', item) === newEmail;
        return dbClient.connect()
        .then(() => dbClient.query('SELECT username,date,email FROM users;'))
        .then(result => {
            const userRows = filter(usernameMatches, result.rows);
            const emailRows = filter(emailMatches, result.rows);
            if(userRows.length > 0) {
                const firstMatch = head(userRows);
                return Promise.reject(`A username of ${firstMatch.username} already exists.`);
            } else if(emailRows.length > 0) {
                const firstMatch = head(emailRows);
                return Promise.reject(`An email of ${firstMatch.email} already exists.`);
            } else {
                return encryptPassword(bcryptModule, saltRounds, newPassword);
            }
        })
        .then( ({salt, hash}) =>
            createUserUnsafe(
                dbClient,
                newUsername,
                hash,
                salt,
                newEmail
            )
        )
    }
)

const deleteUser = curryN(2, 
    (dbClent, username) =>
        client.connect()
        .then(() => client.query(
            'DELETE FROM users WHERE username = $1;',
            [username]
        ))
        .then(result => {
            if(result.rowCount === 0) {
                return Promise.reject(new Error(`Username ${username} was not found.`));
            } else {
                return Promise.resolve(username);
            }
        })
)

module.exports = {
    getDBClient,
    getPostgresClient,
    getUsers,
    createUser,
    deleteUser,
    findUser,
    findUserByUsername,
    findUserByUsernameAndPassword,

    comparePassword,

    login
};