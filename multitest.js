const fs = require("fs");
let count = [];
let save = false

// Config *********************
const strategyName = "emas";
let symbol = "";
let amount = 100;
let timings = ['1m', '3m', '5m', '15m', '30m', '1h']
// *****************************
// ['1m', '3m', '5m', '15m', '30m', '1h']
let strategy = require(`./strategies/${strategyName}.js`);

for (let timing of timings) {
  let obStrategy = null
  let total = 0.0
  let commisions = 0.0
  let transactions = 0
  let freefee = 0.0
  let start = null
  let end = null
  fs.readFile(`./db/data-${timing}.json`, "utf8", async (err, filedata) => {
    let data = JSON.parse(filedata)

    count[timing] = 0
    symbol = data.symbol;
    data.data.sort(function (a, b) {
        return parseInt(a.timestamp) - parseInt(b.timestamp);
    });

    for (let d of data.data) {
        if (start == null) start = d.datetime;
        end = d.datetime;
        let respond = await strategy.test(symbol, amount, d, true, true);
        let candle = respond[0]
        obStrategy = respond[1]
        if (candle.order != null) {
            commisions += candle.order.fee.value;
            freefee += candle.order.profit.free;
            total += candle.order.profit.total;
            transactions += 1;
        }
        count[timing] += 1;
    }
    console.log("-------------------------------");
    let report = {
        time: new Date().toLocaleString(),
        crypto: symbol,
        temp: timing,
        strategy: obStrategy,
        amount: amount,
        start: start,
        end: end,
        fee: commisions,
        trans: transactions,
        freefee: freefee,
        total: total,
        records: count[timing]
    };

    fs.readFile("./db/tests.json", 'utf8', (err, data) => {
        let arr = JSON.parse(data)

        for (let d of arr) {
            if (d.total == 0 || d.crypto == report.crypto && d.temp == report.temp && d.total == report.total) {
                save = false
                break
            }
        }
        if (save) {
            arr.push(report)
            fs.writeFile("./db/tests.json", JSON.stringify(arr), err => err)
        }
    })
    console.log(report);
  });
}
