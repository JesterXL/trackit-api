const { Client } = require('pg');
const {
    filter,
    head,
    get
} = require('lodash/fp');
const moment = require('moment');


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

// INSERT INTO users VALUES ('jesterxl', 'jesse.warden@gmail', 'password', '2018-1-27');
const createUserUnsafe = (client, username, password, email) => {
    const now = moment(new Date()).format('YYYY-MM-DD');
    return client.query(
        'INSERT INTO users(username, email, password, date) VALUES($1, $2, $3, $4)',
        [username, email, password, now]
    );
};

const createUser = (newUsername, newPassword, newEmail) => {
    const usernameMatches = item => get('username', item) === newUsername;
    const client = getDBClient();
    return client.connect()
    .then(() => client.query('SELECT username,date FROM users;'))
    .then(result => {
        const userRows = filter(usernameMatches, result.rows);
        if(userRows.length > 0) {
            const firstMatch = head(userRows);
            return Promise.reject(`${firstMatch.username} already exists.`);
        } else {
            return createUserUnsafe(
                client,
                newUsername,
                newPassword,
                newEmail
            );
        }
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
    deleteUser
};