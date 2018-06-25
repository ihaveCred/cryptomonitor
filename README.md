# cryptomonitor

This is a crypto price monitor support ifttt-like experience, with configurable parameters such as price feed, margin call ratio, etc.

install 
```
npm i cryptomonitor
```

demo
```

const queryCTL = require("cryptomonitor");
let config = {
    curreny: "USD",
    coin: "ethereum",
    collateralCoinCount: 1.2,
    debt: 366.0851651171458
};

queryCTL(config).then(rate => {
    console.log(rate);
});

```

or

```

const queryCTL = require("cryptomonitor");
let config = {
    curreny: "USD",
    coin: "ethereum",
    collateralCoinCount: 1.2,
    debt: 366.0851651171458
};

let margincall = 2;//200%
let margincall_callback = (r) => {
    console.log("alert!! " + r);
}

queryCTL(config, margincall, margincall_callback).then(r => {
    console.log(r);
});

let config2 = {
    curreny: "USD",
    coin: "ethereum",
    collateralCoinCount: (0.1830235864318801 + 0.17058353380320057 + 0.9980547392231892),
    debt: 366.0851651171458,
    cache: true,//if you want cache coin price,set this value true
    expire: 1000 // cache expire time,unit:ms
};

async function test() {
    while (true) {
        var rate = await queryCTL(config2, margincall, margincall_callback);
        console.log(rate);
    }   
}
test();

```

## CTL ifttt extension
Demo code in extension/httpServer.js

You can find margincall service in ifttt.
![Alt text](https://raw.githubusercontent.com/libracredit/cryptomonitor/master/img/img_20180622183856.jpg)

Set your collateral eth count,lend stable coin count and alert ctl line, if your ctl is lt alert line,you will receive alert.
![Alt text](https://raw.githubusercontent.com/libracredit/cryptomonitor/master/img/img_20180622183908.jpg)