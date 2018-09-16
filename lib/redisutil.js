let redisConfig = require("../redisconfig.json");
let redis = require("redis");


let client;
if (redisConfig.useUrl) {
    client = redis.createClient(redisConfig.host, redisConfig.opt);
} else {
    client = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.opt);
}

let authSuccess = !redisConfig.password;
if (redisConfig.password) {
    client.auth(redisConfig.password, (err, reply) => {
        if (err) {
            console.error("redis auth success");
            console.error(err);
        } else {
            console.log("redis auth fail");
            console.log(reply);
            authSuccess = true;
        }
    });
}


module.exports.getAsync = async function (key) {
    return new Promise((resolve, reject) => {
        client.get(key, function (err, reply) {
            if (err) {
                reject(err);
            } else {
                resolve(reply);
            }
        });
    });
};


/**
 * 
 * @param {String} key
 * @param {any} value
 * @param {Number} expSec second
 */
module.exports.setAsync = async function (key, value, expSec) {
    await client.set(key, value, "EX", expSec);//expire 5 mins
};

module.exports.client = client;
