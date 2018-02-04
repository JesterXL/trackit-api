"use strict";

const { has, get } = require("lodash/fp");
const crypto = require("crypto");
const randomNumber = require("random-number-csprng");
const { login } = require('./database').users;

var database = {
    clients: {
        officialApiClient: { secret: "C0FFEE" },
        unofficialClient: { secret: "DECAF" }
    },
    tokensToClientIds: {}
};

const generateToken = data => {
    const start = Math.round(Number.MIN_SAFE_INTEGER / 3);
    const end = Math.round(Number.MAX_SAFE_INTEGER / 3);
    return randomNumber(start, end)
    .then(num => {
        // console.log("num:", num);
        const sha256 = crypto.createHmac("sha256", String(num));
        const result = sha256.update(data).digest("base64");
        // console.log("result:", result);
        return result;
    });
};

const grantClientToken = (credentials, req, cb) => {
    console.time('grantClientToken');
    console.log("grantClientToken, credentials:", credentials);
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

const authenticateToken = (token, req, cb) =>
    new Promise( success => {
    if (has(token, database.tokensToClientIds)) {
        // If the token authenticates, set the corresponding property on the request, and call back with `true`.
        // The routes can now use these properties to check if the request is authorized and authenticated.
        req.clientId = database.tokensToClientIds[token];
        cb(null, true);
        return success(true);
    }

    // If the token does not authenticate, call back with `false` to signal that.
    // Calling back with an error would be reserved for internal server error situations.
    cb(null, false);
    success(false);
});

module.exports = {
    grantClientToken,
    authenticateToken
};