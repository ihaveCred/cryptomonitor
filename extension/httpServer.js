const redisutil = require("../lib/redisutil");
const queryCTL = require("../lib/queryCTL");
const express = require('express');
const bodyParser = require('body-parser')
const uuidv4 = require("uuid/v4");

let app = express();
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

let alertTsMap = new Map();
const alertInterval = 1000 * 60 * 30;//30 mins
const channel_key = 'iWuQxLDF7L6FLFsvfoX6jLsBQCb98_nDRSVnb0rwhzdTWj7hvzH845rg2E-VBR5u';
const redis_key_ifttt_event_prefix = 'ifttt_cred_threshold#';
const redis_key_ifttt_alert_prefix = 'ifttt_cred_alert#';
const redis_ifttt_expire = 3600 * 24;


//for endpoint test
app.get('/ifttt/v1/status', async function (req, res) {

    let receive_key = req.headers['ifttt-channel-key'];
    if (channel_key !== receive_key) {
        res.statusCode = 401;
        res.send({ success: false });
    } else {
        res.send({ success: true });
    }

});

//for endpoint test
app.post('/ifttt/v1/test/setup', async function (req, res) {
    let data = {
        data: {
            samples: {
                triggers: {
                    margincall: {
                        drawcount: "1000",
                        safeline: "1.6",
                        lbacount: "5",
                        ethcount: "2",
                        btccount: "0",
                        htcount: "0",
                        bnbcount: "0"
                    }
                }
            }
        }
    }
    let receive_key = req.headers['ifttt-channel-key'];
    if (channel_key !== receive_key) {
        res.statusCode = 401;
        res.send({ success: false });
    } else {
        res.send(data);
    }
});

app.post('/ifttt/v1/triggers/margincall', async function (req, res) {
    try {
        let eventArray = [];
        let maxItems = 10;
        let limitItems = 10;
        let result = { data: [] };

        limitItems = parseInt(req.body.limit !== undefined ? req.body.limit : maxItems);
        let drawcount = parseFloat(req.body.triggerFields.drawcount);
        let safeline = parseFloat(req.body.triggerFields.safeline);
        let ethcount = parseFloat(req.body.triggerFields.ethcount);
        let lbacount = parseFloat(req.body.triggerFields.lbacount);
        let btccount = parseFloat(req.body.triggerFields.btccount);
        let htcount = parseFloat(req.body.triggerFields.htcount);
        let bnbcount = parseFloat(req.body.triggerFields.bnbcount);


        console.log("=====IFTTT=====in=" + JSON.stringify(req.body));
        let receive_key = req.headers['ifttt-channel-key'];
        if (channel_key !== receive_key) {
            res.statusCode = 401;
            res.send({
                "errors": [
                    {
                        "message": "error key"
                    }
                ]
            });
            return;
        }

        if (req.headers['ifttt-test-mode'] == '1') {
            let error400 = {
                "errors": [
                    {
                        "message": "Missing Trigger Fields"
                    }
                ]
            };

            //如果triggerFields为空
            if (!req.body.triggerFields) {
                res.statusCode = 400;
                error400.errors.message = " Missing 'triggerFields' key";
                res.send(error400);
                return;
            } else if (isNaN(drawcount) || isNaN(safeline) || isNaN(ethcount) || isNaN(lbacount) ||
                isNaN(btccount) || isNaN(btccount) || isNaN(htcount) || isNaN(bnbcount)) {
                res.statusCode = 400;
                res.send(error400);
                return;
            }

            let event = {
                "posted_at": new Date().toISOString(),
                //"created_at": [year, month, date].join('-') + ` ${hour}:${min}:${sec}`,
                "created_at": new Date().toISOString(),
                "meta": {
                    "id": uuidv4(),
                    "timestamp": parseInt(new Date().getTime() / 1000)
                }
            }
            result.data.push(event);
            event = {
                "posted_at": new Date().toISOString(),
                //"created_at": [year, month, date].join('-') + ` ${hour}:${min}:${sec}`,
                "created_at": new Date().toISOString(),
                "meta": {
                    "id": uuidv4(),
                    "timestamp": parseInt(new Date().getTime() / 1000)
                }
            }
            result.data.push(event);
            event = {
                "posted_at": new Date().toISOString(),
                //"created_at": [year, month, date].join('-') + ` ${hour}:${min}:${sec}`,
                "created_at": new Date().toISOString(),
                "meta": {
                    "id": uuidv4(),
                    "timestamp": parseInt(new Date().getTime() / 1000)
                }
            }
            result.data.push(event);
            if (result.data.length > limitItems) {
                result.data.length = limitItems;
            }

            res.send(result);
            return;
        }

        if (!req.body.triggerFields || isNaN(drawcount) || isNaN(safeline) || isNaN(ethcount) || isNaN(lbacount) ||
            isNaN(btccount) || isNaN(btccount) || isNaN(htcount) || isNaN(bnbcount)) {
            res.statusCode = 400;
            res.send({
                "errors": [
                    {
                        "message": "Missing Trigger Fields"
                    }
                ]
            });
            return;
        }

        let ethPrice = (await require("../utils/tickerutil").queryCollateralTicker()).ETH;
        let lbaPrice = (await require("../utils/tickerutil").queryCollateralTicker()).LBA;
        let btcPrice = (await require("../utils/tickerutil").queryCollateralTicker()).BTC;
        let htPrice = (await require("../utils/tickerutil").queryCollateralTicker()).HT;
        let bnbPrice = (await require("../utils/tickerutil").queryCollateralTicker()).BNB;

        let ctl = (ethcount * ethPrice + lbacount * lbaPrice + btccount * btcPrice +
            htcount * htPrice + bnbcount * bnbPrice) / drawcount;
        let needAlert = ctl < safeline;

        let id = req.body.ifttt_source.id;
        let interval_condition = false;

        //if is not a new id
        let cacheTime = await redisutil.getAsync(redis_key_ifttt_alert_prefix + id);
        if (cacheTime) {
            let now = new Date().getTime();
            interval_condition = (now - cacheTime) >= alertInterval;
            let cachedEvents = await redisutil.getAsync(redis_key_ifttt_event_prefix + id);
            eventArray = JSON.parse(cachedEvents);
        }
        let log_obj = { id: id, lastTime: alertTsMap.get(id), ctl: ctl, safeLine: safeline, interval: alertInterval };
        if (needAlert && (!cacheTime || interval_condition)) {
            var now = new Date();
            var year = now.getFullYear();
            var month = now.getMonth() + 1;
            if (month < 10) {
                month = "0" + month;
            }
            var date = now.getDate();
            if (date < 10) {
                date = "0" + date;
            }
            let hour = now.getHours();
            let min = now.getMinutes();
            let sec = now.getSeconds();
            hour = hour < 10 ? ("0" + hour) : hour;
            min = min < 10 ? ("0" + min) : min;
            sec = sec < 10 ? ("0" + sec) : sec;
            let event = {
                "posted_at": new Date().toISOString(),
                //"created_at": [year, month, date].join('-') + ` ${hour}:${min}:${sec}`,
                "created_at": new Date().toISOString(),
                "meta": {
                    "id": uuidv4(),
                    "timestamp": parseInt(new Date().getTime() / 1000)
                }
            }
            eventArray.unshift(event);
            if (eventArray > maxItems) {
                eventArray.length = maxItems;
            }
            redisutil.setAsync(redis_key_ifttt_alert_prefix + id, new Date().getTime(), redis_ifttt_expire);
            //alertTsMap.set(id, new Date().getTime());
            redisutil.setAsync(redis_key_ifttt_event_prefix + id, JSON.stringify(eventArray), redis_ifttt_expire);
        }
        if (eventArray.length > limitItems) {
            eventArray.length = limitItems;
        }
        result.data = eventArray;
        log_obj.result = result;

        console.log("=====IFTTT=====out=" + JSON.stringify(log_obj));
        res.send(result);
    } catch (e) {
        console.error(e);
        res.statusCode = 400;
        res.send({
            "errors": [
                {
                    "message": "something wrong!"
                }
            ]
        });
    }
});

let SERVER_PORT = 8080;
let server = app.listen(SERVER_PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('app listening at http://%s:%s', host, port);
});
