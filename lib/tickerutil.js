const request = require("request");

const queryCoinmarketcap = async (coin, convert) => {
    let url = `https://api.coinmarketcap.com/v1/ticker/${coin}/?convert=${convert}`;
    return new Promise((resolve, reject) => {
        request.get({
            uri: url,
            timeout: 5000
        }, (err, reps, jsonStr) => {
            if (err) {
                reject(err);
                return;
            }
            try {
                var jsonArray = JSON.parse(jsonStr);
                if (!jsonArray.length) {
                    reject(new Error("invalid json array"));
                } else {
                    resolve(jsonArray[0]);
                }
            } catch (e) {
                reject(e);
            }
        });
    });
};

const queryCryptocompare = async (sym, convert) => {
    let url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${sym === "BTC" ? "BTC" : ("BTC," + sym)}&tsyms=${convert === "USD" ? "USD" : ("USD," + convert)}`;
    return new Promise((resolve, reject) => {
        request.get({
            uri: url,
            timeout: 5000
        }, (err, reps, jsonStr) => {
            if (err) {
                reject(err);
                return;
            }
            try {
                var jsonObj = JSON.parse(jsonStr);
                let obj = jsonObj.RAW[sym][convert];
                if (obj) {
                    let change = parseInt(jsonObj.RAW[sym]["USD"].CHANGEPCT24HOUR * 100) / 100;
                    let r = {
                        symbol: sym,
                        last_updated: obj.LASTUPDATE,
                        percent_change_24h: change,
                        price_usd: jsonObj.RAW[sym]["USD"].PRICE,
                        price_btc: jsonObj.RAW[sym]["USD"].PRICE / jsonObj.RAW["BTC"]["USD"].PRICE
                    };
                    r["price_" + convert.toLowerCase()] = obj.PRICE;
                    resolve(r);
                } else {
                    reject(new Error("NOT FOUND!!!" + url + "," + JSON.stringify(obj)));
                }
            } catch (e) {
                reject(e);
            }
        });

    });
};

let symbolMap = null;

const queryBlockCC = async (sym, convert) => {
    async function getExchangeRate(convert) {
        convert = (convert || "usd").toUpperCase();
        if (convert === "USD") {
            return 1;
        } else {
            return new Promise((resolve, reject) => {
                request({
                    method: 'GET',
                    url: 'https://data.block.cc/api/v1/exchange_rate',
                    timeout: 5000
                }, function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        try {
                            body = JSON.parse(body);
                            if (body.code === 0) {
                                resolve(body.data.rates[convert]);
                            } else {
                                reject(new Error("错误的返回结果:" + body));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    }
                });
            });
        }
    }

    async function getSymbolMap() {

        if (symbolMap) {
            return symbolMap;
        } else {
            return new Promise((resolve, reject) => {
                request({
                    method: 'GET',
                    url: 'https://data.block.cc/api/v1/symbols',
                    timeout: 5000
                }, function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        try {
                            body = JSON.parse(body);
                            if (body.code === 0) {
                                symbolMap = {};
                                for (var i = 0; i < body.data.length; i++) {
                                    if (!symbolMap[body.data[i].symbol]) {
                                        symbolMap[body.data[i].symbol] = body.data[i].name;
                                    }
                                }
                                resolve(symbolMap);
                            } else {
                                reject(new Error("错误的返回结果:" + body));
                            }
                        } catch (e) {
                            reject(e);
                        }

                    }
                });
            });
        }
    }

    let convertRate = await getExchangeRate(convert);
    let symbolObjectMap = await getSymbolMap();

    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            url: 'https://data.block.cc/api/v1/price?symbol_name=bitcoin,' + symbolObjectMap[sym],
            timeout: 5000
        }, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                try {
                    body = JSON.parse(body);
                    if (body.code === 0) {
                        let btcData = body.data[0];
                        let data = sym !== "BTC" ? body.data[1] : body.data[0];
                        if (!data) {
                            reject(new Error("没有查询到" + sym + "牌价"));
                            return;
                        }
                        let result = {
                            "symbol": sym,
                            "last_updated": parseInt(data.timestamps / 1000),
                            "percent_change_24h": data.change_daily,
                            "price_usd": data.price,
                            "price_btc": data.price / btcData.price
                        };
                        if (convert !== "USD") {
                            result["price_" + convert.toLowerCase()] = data.price * convertRate
                        }
                        resolve(result);
                    } else {
                        reject(new Error("错误的返回结果:" + body));
                    }
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
};

const queryHuobi = (sym, convert) => {
    if (convert !== "USD") {
        throw new Error("Huobi不支持除开USD外其他法币");
    }
    if (sym === "BNB" || sym === "DAI" || sym === "USDT") {
        throw new Error("火币不含BNB、DAI、USDT");
    }
    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            url: 'https://api.huobipro.com/market/history/trade?symbol=' + sym + 'usdt&size=1',
            timeout: 5000,
        }, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                try {
                    body = JSON.parse(body);
                    let price = body.data[0].data[0].price;
                    if (price > 0) {

                        let r = {
                            symbol: sym,
                            last_updated: new Date().getTime(),
                            price_usd: price
                        };
                        resolve(r);
                    } else {
                        reject(sym + "数据出错");
                    }
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}

const queryBinance = (sym, convert) => {
    if (convert !== "USD") {
        throw new Error("不支持除开USD外其他法币");
    }
    if (sym === "HT" || sym === "DAI" || sym === "USDT") {
        throw new Error("币安不含HT、DAI、USDT");
    }
    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            url: 'https://api.binance.com/api/v3/ticker/price',
            timeout: 5000
        }, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                try {
                    body = JSON.parse(body);
                    let data = body.filter(s => s.symbol === `${sym}USDT`);
                    let btcPrice = parseFloat(body.filter(s => s.symbol === `BTCUSDT`)[0].price);
                    if (data.length === 0) {
                        reject("BN 不含" + sym + " 数据出错");
                        return;
                    }
                    else {
                        let r = {
                            symbol: sym,
                            last_updated: new Date().getTime(),
                            price_usd: data[0].price,
                            price_btc: data[0].price / btcPrice
                        };
                        resolve(r);
                    }
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}

let cacheMap = new Map();

function cacheTickerValue(key, value, exp) {
    exp = exp || 90 * 1000;
    let expTime = new Date().getTime() + exp;
    cacheMap[key] = { value, expTime };
}

function getCacheValue(key) {
    let cacheData = cacheMap[key];
    if (cacheData) {
        if (cacheData.expTime < new Date().getTime()) {
            return null
        } else {
            return cacheData.value;
        }

    } else {
        return null;
    }
}

let refreshTasks = new Set();
async function queryTicker(coin, sym, refresh) {
    let convert = "USD";
    sym = sym.toUpperCase();
    convert = convert.toUpperCase();
    let taskKey = JSON.stringify({ coin, sym, convert });
    refreshTasks.add(taskKey);
    let key = "TICKER_" + coin + "_" + sym + "-" + convert;
    let now = new Date().getTime();
    let cacheValue = await getCacheValue(key);
    if (cacheValue && !refresh) {
        return cacheValue;
    }
    let allTask = [
        async function () {
            try {
                return { type: "coinmarketcap", data: await queryCoinmarketcap(coin, convert) };
            } catch (e) {
                return { type: "coinmarketcap", data: null };
            }
        }(),
        async function () {
            try {
                return { type: "cryptocompare", data: await queryCryptocompare(sym, convert) };
            } catch (e) {
                return { type: "cryptocompare", data: null };
            }
        }(),
        async function () {
            try {
                return { type: "blockcc", data: await queryBlockCC(sym, convert) };
            } catch (e) {
                return { type: "blockcc", data: null };
            }
        }(),
        async function () {
            try {
                return { type: "huobi", data: await queryHuobi(sym, convert) };
            } catch (e) {
                return { type: "huobi", data: null };
            }
        }(),
        async function () {
            try {
                return { type: "binance", data: await queryBinance(sym, convert) };
            } catch (e) {
                return { type: "binance", data: null };
            }
        }()
    ];
    let finalResult = null;
    let allResult = await Promise.all(allTask);
    let successResult = allResult.filter(r => r.data !== null);
    if (successResult.length >= 3) {
        successResult = successResult.sort((a, b) => {
            return parseFloat(a.data.price_usd) - parseFloat(b.data.price_usd);
        });
        //AVG
        let middleData = successResult.slice(1, successResult.length - 1);
        if (middleData.length === 1) {
            finalResult = middleData[0];
        } else {
            finalResult = middleData[0];
            for (var i = 1; i < middleData.length; i++) {
                finalResult.type += "," + middleData[i].type;
                finalResult.data.price_usd = (parseFloat(finalResult.data.price_usd) + parseFloat(middleData[i].data.price_usd)) / 2;
            }
        }
    } else if (successResult.length === 2) {
        let p1 = parseFloat(successResult[0].data.price_usd);
        let p2 = parseFloat(successResult[1].data.price_usd);
        if (Math.abs(p1 - p2) / p1 <= 0.01) {
            //OK
            finalResult = successResult[0];
        } else if (cacheValue) {
            let perviousPrice = parseFloat(cacheValue.price_usd);
            if (Math.abs(p1 - perviousPrice) > Math.abs(p2 - perviousPrice)) {
                finalResult = successResult[1];
            } else {
                finalResult = successResult[0];
            }
        } else {
            throw new Error("DATA UNRELIABILITY");
        }

    } else if (successResult.length === 1) {
        if (cacheValue) {
            let perviousPrice = parseFloat(cacheValue.price_usd);
            let resultPrice = parseFloat(successResult[0].data.price_usd);
            if (Math.abs(perviousPrice - resultPrice) / perviousPrice <= 0.01) {
                finalResult = successResult[0];
            } else {
                throw new Error("DATA UNRELIABILITY");
            }
        } else {
            finalResult = successResult[0];
        }
    } else {
        throw new Error("NO SOURCE AVAILABLE");
    }

    let result = { source: finalResult.type, price_usd: finalResult.data.price_usd, symbol: finalResult.data.symbol };
    cacheTickerValue(key, result);
    return result;
};



let sleep = (async (ms) => new Promise(resolve => setTimeout(resolve, ms)));
let refreshInterval = 30 * 1000;

setInterval(() => {
    if (refreshTasks.size === 0) {
        return;
    }
    let sleepInterval = refreshInterval / refreshTasks.size;
    (async () => {
        for (var task of refreshTasks) {
            let { coin, sym, convert } = JSON.parse(task);
            queryTicker(coin, sym, true);
            await sleep(sleepInterval);
        }
    })();
}, refreshInterval);


module.exports.queryTicker = queryTicker;