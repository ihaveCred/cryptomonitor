let https = require('https');
let tickerutil = require("./tickerutil");
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
    let allCollaterals = await Promise.all(config.assets.map(d => {
        return (async () => {
            return (await tickerutil.queryTicker(d.coin, d.sym, false)).price_usd * d.count;
        })();
    }));

    let allValue = allCollaterals.reduce((p, c) => {
        return p + c;
    }, 0);

    let ctl = allValue / config.debt;

    if (margincall && ctl <= margincall) {
        alertcallback(ctl);
    }
    return ctl;
}

module.exports = queryCTL;