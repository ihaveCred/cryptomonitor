
const queryCTL = require("./queryCTL");
const express = require('express');
const bodyParser = require('body-parser')

let app = express();
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

let alertTsMap = new Map();
const alertInterval = 1000 * 60 * 30;//30 mins

app.post('/ifttt/v1/triggers/margincall', async function (req, res) {
    try {
        var ethcount = parseFloat(req.body.triggerFields.ethcount);
        var drawcount = parseFloat(req.body.triggerFields.drawcount);
        let safeline = parseFloat(req.body.triggerFields.safeline);
        let id = req.body.ifttt_source.id;

        let config = {
            curreny: "USD",
            coin: "ethereum",
            collateralCoinCount: ethcount,
            debt: drawcount
        };
        let rate = await queryCTL(config);
        let needAlert = rate <= safeline;
        let result = { data: [] };
        if (needAlert && (!alertTsMap.has(id) || (new Date().getTime() - alertTsMap.get(id)) >= alertInterval)) {
            result.data = [
                {
                    "posted_at": new Date().toISOString(),
                    "meta": {
                        "id": uuidv4(),
                        "timestamp": parseInt(new Date().getTime() / 1000)
                    }
                }
            ];
            alertTsMap.set(id, new Date().getTime());
        }
        res.send(result);
    } catch (e) {
        console.error(e);
        res.send({ "error": "error" });
    }
});

let SERVER_PORT = 8080;
let server = app.listen(SERVER_PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('app listening at http://%s:%s', host, port);
});
