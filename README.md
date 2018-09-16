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


```

## CTL ifttt extension
Demo code in extension/httpServer.js

You can find margincall service in ifttt.

![Alt text](https://raw.githubusercontent.com/libracredit/cryptomonitor/master/img/img_20180622183856.jpg)

Set your collateral eth count,lend stable coin count and alert ctl line, if your ctl is lt alert line,you will receive alert.
![Alt text](https://raw.githubusercontent.com/libracredit/cryptomonitor/master/img/img_20180622183908.jpg)
