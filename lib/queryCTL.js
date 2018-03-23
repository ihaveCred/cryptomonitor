
let https = require('https');

//let config = {
//    curreny: "USD",
//    coin: "ethereum",
//    //initPrice: 500,
//    collateralCoinCount: (0.1830235864318801 + 0.17058353380320057 + 0.9980547392231892),
//    debt: 366.0851651171458
//};

async function queryCTL(config) {
    let monitorUrl = `https://api.coinmarketcap.com/v1/ticker/${config.coin}/?convert=${config.curreny}`;
    const query = async () => {
        return new Promise((resolve, reject) => {
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
    var data = await query();
    var coinPrice = parseFloat(data[0]["price_" + config.curreny.toLowerCase()]);
    var rate = config.collateralCoinCount * coinPrice / config.debt;
    return rate;
}

//async function main() {
//    var result = await queryCTL(config);
//    console.log(result);
//}
//main();

module.exports = queryCTL;