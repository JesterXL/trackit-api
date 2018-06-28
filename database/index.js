const { curry } = require('lodash/fp')

const getDBClient = curry((clientClass, user, database, ssl) =>
        new clientClass({
            // connectionString: process.env.DATABASE_URL,
            user,
            database,
            ssl,
        }
    )
)

module.exports = {
    getDBClient
}