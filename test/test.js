let config = {
    curreny: "USD",
    coin: "ethereum",
    //initPrice: 500,
    collateralCoinCount: (0.1830235864318801 + 0.17058353380320057 + 0.9980547392231892),
    debt: 366.0851651171458
};
var queryCTL = require("../index");

//queryCTL(config).then(r => {
//    console.log(r);
//});

let margincall = 2;
let margincall_callback = (r) => {
    console.log("alert!! " + r);
}

//queryCTL(config, margincall, margincall_callback).then(r => {
//    console.log(r);
//});

let config2 = {
    curreny: "USD",
    coin: "ethereum",
    collateralCoinCount: (0.1830235864318801 + 0.17058353380320057 + 0.9980547392231892),
    debt: 366.0851651171458,
    cache: true,
    expire: 1000
};

async function test() {
    while (true) {
        var rate = await queryCTL(config2, margincall, margincall_callback);
        console.log(rate);
    }
    
}

test();
 