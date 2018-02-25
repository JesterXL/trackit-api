"use strict";

const { has, get } = require("lodash/fp");
const crypto = require("crypto");
const randomNumber = require("random-number-csprng");
const curryN = require('lodash/fp/curryN');

const getHMAC = curryN(3,
    (cryptoModule, number, data) =>
        cryptoModule.createHmac('sha256', String(number))
        .update(data)
        .digest('base64')
)

const getRandomNumber = randomNumberInRangeFunction => {
    const start = Math.round(Number.MIN_SAFE_INTEGER / 3);
    const end = Math.round(Number.MAX_SAFE_INTEGER / 3);
    return randomNumberInRangeFunction(start, end)
}

const generateToken = curryN(4, (
        cryptoModule, 
        randomNumberInRangeFunction, 
        getHMACFunction,
        data
    ) =>
        getRandomNumber(randomNumberInRangeFunction)
        .then(num => getHMACFunction(cryptoModule, num, data))
)

const grantClientToken = (credentials, req, cb) => {
    const username = get('clientId', credentials);
    const password = get('clientSecret', credentials);
    return login(username, password)
    .then(user => {
        console.log("grantClientToken, user:", user);
        generateToken(credentials.clientId + ":" + credentials.clientSecret)
        .then(token => {
            database.tokensToClientIds[token] = credentials.clientId;

            // Call back with the token so Restify-OAuth2 can pass it on to the client.
            console.timeEnd('grantClientToken');
            cb(null, token);
            return Promise.resolve(token);
        })
    })
    .catch( error => {
        console.log("grantClientToken, error:", error);
        cb(null, false);
        return Promise.resolve(false);
    })
};

// const authenticateToken = (token, req, cb) =>
//     new Promise( success => {
//     if (has(token, database.tokensToClientIds)) {
//         // If the token authenticates, set the corresponding property on the request, and call back with `true`.
//         // The routes can now use these properties to check if the request is authorized and authenticated.
//         req.clientId = database.tokensToClientIds[token];
//         cb(null, true);
//         return success(true);
//     }

//     // If the token does not authenticate, call back with `false` to signal that.
//     // Calling back with an error would be reserved for internal server error situations.
//     cb(null, false);
//     success(false);
// });

// module.exports = {
//     grantClientToken,
//     authenticateToken
// };

module.exports = {
    getHMAC,
    getRandomNumber,
    randomNumber,
    generateToken
};