const {
    filter,
    head,
    get,
    curry,
    first
} = require('lodash/fp');
const moment = require('moment');
const bcrypt = require('bcrypt');

const saltRounds = 16;
const DB_USERNAME = 'jessewarden';
const DB_NAME = 'jessewarden';
const SSL = false;

const logIt = curry((label, args) => console.log(label, args) && args)

const getUsers = dbClient =>
    dbClient.query('SELECT username,date FROM users;')
    .then(result => result.rows)
    // .then(logIt('getUsers::rows'))

const findUser = curry((dbClient, id) =>
    dbClient.query('SELECT id,username FROM users WHERE id = $1;', [id])
    .then(result => {
        if(result.rowCount > 0) {
            return first(result.rows);
        } else {
            return Promise.reject(new Error(`User id ${id} not found.`));
        }
    })
)

const comparePassword = curry((bycryptModule, password, hash) =>
    bycryptModule.compare(password, hash)
)

const login = curry((bycryptModule, dbClient, username, password) =>
    dbClient.query('SELECT id,username,password,salt FROM users WHERE username = $1', [username])
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

const findUserByUsername = curry((dbClient, username) =>
    dbClient.query('SELECT id,username FROM users WHERE username = $1;', [username])
    .then(result => {
        if(result.rowCount > 0) {
            return first(result.rows);
        } else {
            return Promise.reject(new Error(`Username ${username} not found.`));
        }
    })
)

// INSERT INTO users VALUES ('jesterxl', 'jesse.warden@gmail', 'password', '2018-1-27');
const createUserUnsafe = curry((dbClient, username, passwordHash, salt, email) => {
        const now = moment(new Date()).format('YYYY-MM-DD');
        return dbClient.query(
            'INSERT INTO users(username, email, salt, password, date) VALUES($1, $2, $3, $4, $5)',
            [username, email, passwordHash, salt, now]
        )
        .then(result => {
            if(result.rowCount > 0) {
                return first(result.rows);
            } else {
                return Promise.reject(new Error('failed to create user'));
            }
        });
    }
)

const generateSalt = curry((bcryptModule, saltRounds) =>
    bcryptModule.genSalt(saltRounds)
)

const hashPassword = curry((bcryptModule, password, salt) =>
    bcryptModule.hash(password, salt)
)

const encryptPassword = curry((bcryptModule, saltRounds, password) =>
    generateSalt(bcryptModule, saltRounds)
    .then(salt =>
        hashPassword(bcryptModule, password, salt)
        .then(encryptedPassword => ({ salt, encryptedPassword}))
    )
)

const createUser = curry((bcryptModule, dbClient, saltRounds, newUsername, newPassword, newEmail) => {
        const usernameMatches = item => get('username', item) === newUsername;
        const emailMatches = item => get('email', item) === newEmail;
        return dbClient.query('SELECT username,date,email FROM users;')
        .then(result => {
            const userRows = filter(usernameMatches, result.rows);
            const emailRows = filter(emailMatches, result.rows);
            if(userRows.length > 0) {
                const firstMatch = head(userRows);
                return Promise.reject(`A username of ${firstMatch.username} already exists.`);
            } else if(emailRows.length > 0) {
                const firstMatch = head(emailRows);
                return Promise.reject(`An email of ${firstMatch.email} already exists.`);
            }
            return encryptPassword(bcryptModule, saltRounds, newPassword)
        })
        .then( ({salt, encryptedPassword}) =>
            createUserUnsafe(
                dbClient,
                newUsername,
                encryptedPassword,
                salt,
                newEmail
            )
        )
    }
)

const deleteUser = curry((dbClient, username) =>
        dbClient.query(
            'DELETE FROM users WHERE username = $1;',
            [username]
        )
        .then(result => {
            if(result.rowCount === 0) {
                return Promise.reject(new Error(`Username ${username} was not found.`));
            } else {
                return Promise.resolve(first(result.rows));
            }
        })
)

module.exports = {
    getDBClient,
    getUsers,
    createUser,
    deleteUser,
    findUser,
    findUserByUsername,

    generateSalt,
    comparePassword,
    encryptPassword,

    login
};