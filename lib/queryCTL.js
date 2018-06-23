let https = require('https');

let cacheMap = new Map();

const simpleMap = {
    "BITCOIN": "BTC",
    "ETHEREUM": "ETH",
    "TETHER": "USDT"
};

async function queryCTL(config, margincall, alertcallback) {
    if (margincall !== undefined && margincall <= 0) {
        throw new Error("margincall must larger than 0");
    }
    let key = config.coin + " " + config.curreny;



    const firstQuery = async () => {
        return new Promise((resolve, reject) => {
            let monitorUrl = `https://api.coinmarketcap.com/v1/ticker/${config.coin}/?convert=${config.curreny}`;
            https.get(monitorUrl, (res) => {
                let jsonStr = "";
                res.on("data", (chunk) => {
                    jsonStr += chunk;
                });
                res.on("end", () => {
                    try {
                        var jsonArray = JSON.parse(jsonStr);
                        if (!jsonArray.length) {
                            reject(new Error("invalid json array"));
                            return;
                        }
                        resolve(jsonArray);
                    } catch (e) {
                        reject(e);
                    }
                });
                res.on("error", (e) => {
                    reject(e);
                });
            });
        });
    }

    const failoverQuery = async () => {
        return new Promise((resolve, reject) => {

            let sym = config.coin.toUpperCase();
            if (simpleMap[sym]) {
                sym = simpleMap[sym];
            }

            let monitorUrl = `https://min-api.cryptocompare.com/data/price?fsym=${sym}&tsyms=${config.curreny}`;
            https.get(monitorUrl, (res) => {
                let jsonStr = "";
                res.on("data", (chunk) => {
                    jsonStr += chunk;
                });
                res.on("end", () => {
                    try {
                        var jsonObj = JSON.parse(jsonStr);
                        if (jsonObj[config.curreny.toUpperCase()]) {
                            let data = {};
                            data["price_" + config.curreny.toLowerCase()] = jsonObj[config.curreny.toUpperCase()];
                            resolve([data]);
                        } else {
                            reject("not found");
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
                res.on("error", (e) => {
                    reject(e);
                });
            });
        });
    }

    const query = async () => {
        try {
            return await firstQuery();
        } catch (e) {
            return await failoverQuery();
        }
    };


    let now = new Date().getTime();
    let data;
    if (config.cache && cacheMap.has(key)) {
        let cacheObj = cacheMap.get(key);
        if ((now - cacheObj.cacheDate) < config.expire) {
            data = cacheObj.data;
        } else {
            data = await query();
            cacheMap.set(key, { cacheDate: now, data: data });
        }
    } else if (config.cache) {
        data = await query();
        cacheMap.set(key, { cacheDate: now, data: data });
    } else {
        data = await query();
    }

    var coinPrice = parseFloat(data[0]["price_" + config.curreny.toLowerCase()]);
    var rate = config.collateralCoinCount * coinPrice / config.debt;
    if (margincall && rate <= margincall) {
        alertcallback(rate);
    }
    return rate;
}

module.exports = queryCTL;