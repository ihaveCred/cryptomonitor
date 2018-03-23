# cryptomonitor

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