
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
