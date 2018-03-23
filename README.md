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

```

