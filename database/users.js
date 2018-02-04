const { Client } = require('pg');
const {
    filter,
    head,
    get
} = require('lodash/fp');
const moment = require('moment');
const bcrypt = require('bcrypt');
const saltRounds = 16;

const getDBClient = () => {
	const client = new Client({
		// connectionString: process.env.DATABASE_URL,
		user: 'jessewarden',
		database: 'jessewarden',
		ssl: false,
	});
	return client;
};

const getUsers = () => {
    const client = getDBClient();
    return client.connect()
    .then(() => client.query('SELECT username,date FROM users;'));
};

const findUser = id => {
    const client = getDBClient();
    return client.connect()
    .then(() => client.query('SELECT id,username FROM users WHERE id = $1;', [id]))
    .then(result => {
        if(result.rowCount > 0) {
            return result.rows[0];
        } else {
            return Promise.reject(new Error(`User id ${id} not found.`));
        }
    });
};

const comparePassword = (password, hash) => {
    console.log("password:", password, ", hash:", hash);
    return new Promise((success, failure) =>
        bcrypt.compare(password, hash, (error, res) => {
            // error ? failure(error)
            // : success(res);
            console.log("error:", error);
            console.log("res:", res);
            if(error) {
                return failure(error);
            }
            success(res);
        }));
};

const login = (username, password) => {
    const client = getDBClient();
    return client.connect()
    .then(() => client.query('SELECT id,username,password,salt FROM users WHERE username = $1', [username]))
    .then(result => {
        if(result.rowCount > 0) {
            const potentialUser = result.rows[0];
            console.log("potentialUser:", potentialUser);
            return comparePassword(password, potentialUser.salt)
            .then(aMatch => {
                console.log("aMatch:", aMatch);
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
    });
};

const findUserByUsername = username => {
    const client = getDBClient();
    return client.connect()
    .then(() => client.query('SELECT id,username FROM users WHERE username = $1;', [username]))
    .then(result => {
        if(result.rowCount > 0) {
            return result.rows[0];
        } else {
            return Promise.reject(new Error(`Username ${username} not found.`));
        }
    });
};

const findUserByUsernameAndPassword = (username, password) => {
    const client = getDBClient();
    return client.connect()
    .then(() => client.query('SELECT id,username FROM users WHERE username = $1 AND password = $2;', [username, password]))
    .then(result => {
        if(result.rowCount > 0) {
            return result.rows[0];
        } else {
            return Promise.reject(new Error(`Username ${username} and password combination not found.`));
        }
    });
};

// INSERT INTO users VALUES ('jesterxl', 'jesse.warden@gmail', 'password', '2018-1-27');
const createUserUnsafe = (client, username, passwordHash, salt, email) => {
    const now = moment(new Date()).format('YYYY-MM-DD');
    return client.query(
        'INSERT INTO users(username, email, salt, password, date) VALUES($1, $2, $3, $4, $5)',
        [username, email, passwordHash, salt, now]
    );
};

const encryptPassword = password =>
    new Promise((success, failure) => {
        bcrypt.genSalt(saltRounds, (genSaltError, salt) => {
            if(genSaltError) {
                return failure(genSaltError);
            }
            bcrypt.hash(password, salt, (hashError, hash) => {
                // bcrypt.compare(password, hash, (compareError, res) => {
                // });
                if(hashError) {
                    return failure(hashError);
                }
                success({salt, hash});
            });
        });
    });

const createUser = (newUsername, newPassword, newEmail) => {
    const usernameMatches = item => get('username', item) === newUsername;
    const emailMatches = item => get('email', item) === newEmail;
    const client = getDBClient();
    return client.connect()
    .then(() => client.query('SELECT username,date,email FROM users;'))
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
            return encryptPassword(newPassword);
        }
    })
    .then( ({salt, hash}) => {
        return createUserUnsafe(
            client,
            newUsername,
            hash,
            salt,
            newEmail
        );
    });
};

const deleteUser = username => {
    const client = getDBClient();
    return client.connect()
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
    });
};

module.exports = {
    getUsers,
    createUser,
    deleteUser,
    findUser,
    findUserByUsername,
    findUserByUsernameAndPassword,
    login
};