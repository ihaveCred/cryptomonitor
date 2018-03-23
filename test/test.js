let config = {
    curreny: "USD",
    coin: "ethereum",
    //initPrice: 500,
    collateralCoinCount: (0.1830235864318801 + 0.17058353380320057 + 0.9980547392231892),
    debt: 366.0851651171458
};
var queryCTL = require("../index");

queryCTL(config).then(r => {
    console.log(r);
});

queryCTL(config, 2, (r) => {
    console.log("alert!! " + r);
}).then(r => {
    console.log(r);
});