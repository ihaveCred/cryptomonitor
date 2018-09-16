
const queryCTL = require("../index");

let config = {
    assets: [
        {
            coin: "ethereum",
            sym: "eth",
            count: 0.5
        },
        {
            coin: "bitcoin",
            sym: "btc",
            count: 0.1
        },
        {
            coin: "ht",
            sym: "ht",
            count: 10
        },
        {
            coin: "lba",
            sym: "lba",
            count: 1000
        },
        {
            coin: "bnb",
            sym: "bnb",
            count: 180
        }
    ],
    debt: 400
};


let margincall = 2;
let margincall_callback = (r) => {
    console.log("alert!! " + r);
}

async function test() {
    var rate = await queryCTL(config, margincall, margincall_callback);
    console.log(rate);
}

test();
