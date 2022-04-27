const fs = require("fs");
var Table = require('cli-table');
const server = require("./libs/server.js");
const Candle = require("./libs/Candle.js");
const IndicatorJS= require("./libs/IndicatorJS.js");
let {Strategy} = require("./strategies/emas.js");

let save = true
let chart = true

let start = null
let end = null;
// Config *********************
let symbol = "LTCUSDT";
let timings = ['1m','3m','5m','15m','30m'];
timings = ['5m']
let iniTime = new Date('03/3/2020')
let endTime = new Date()
let records = 2000
let periodema1 = [3,5,8,13]
let periodema2 = [62,89,144,233]

//periodema1 = [3]
//periodema2 = [62]

if(periodema1.length>1) chart= false
valueEmas = [62]
// *****************************
// console.clear() 
fs.writeFile("./db/tests.csv", "", err => err)
const table = new Table({
    head: ['temp', 'params', 'trans', 'tendencia', 'total ', 'Porcentaje'],
    colWidths: []
});
for(let period1 of periodema1){// Bucle de test de variables de la estrategia
    for(let period2 of periodema2){
    for(let timing of timings){
        if(timings.length > 1) chart = false
        fs.readFile(`./db/histories/${symbol}-${timing}.json`, "utf8", async (err, filedata) => {
            let dataChart = [[],[],[],[],[],[],[],[],[],[],[],[]]
            let data = JSON.parse(filedata);
            let strategy = new Strategy(data.symbol, {ema1:period1,ema2:period2}, true, true)
            strategy.logs = false
            let groups = [0,2000,4000,6000,8000]
            groups = [5000]
            for(let sl of groups){   
                let high = 0, low = null
                let slice = data.data.slice(sl,sl+records)
                let sampleav = 0 
                let count = 0;
                let total = 0.0;
                let commisions = 0.0;
                let transactions = {
                    posi: 0,
                    neg: 0,
                    total: 0
                };
                let lastOrderLong = null
                let lastCandle = null
                for (let d of slice) {
                    count++
                    let candle = new Candle(d)
                    lastCandle = candle
                    sampleav += candle.price
                    // Registro de escenario 
                    high = candle.high > high ? candle.high : high
                    low = candle.low <= (low ?? candle.low) ? candle.low : low
                    
                    let oOpen = null 
                    let oClose = null 
                    
                    if (iniTime < candle.time ) {  
                        let [op, cl, st] = await strategy.test(candle);
                      
                        if(op!=null){
                            oOpen = op.open.price 
                        }
                        if(cl!=null){
                            oClose = cl.close.price
                            commisions += cl.fee.value;
                            total += cl.profit.total;
                            cl.profit.total > 0 ? transactions.posi += 1 : transactions.neg += 1
                            transactions.total++
                            transactions.percent = transactions.posi * 100 / transactions.total                 
                            
                        }
                        dataChart[0].push("'"+candle.datetime+"'")
                        dataChart[1].push([candle.close,candle.open])
                        dataChart[2].push([candle.high,candle.low])
                        dataChart[3].push(st.ema1.val)
                        dataChart[4].push(st.ema2.val)
                        dataChart[5].push(oOpen)
                        dataChart[6].push(oClose)
                        //dataChart[7].push(st.ema3.val)
                        //dataChart[8].push(st.ema4.val)
                        let points = [
                            //new Date(2021,11,20,15,30,0).valueOf(),
                            //new Date(2021,11,23,17,30,0).valueOf(),
                        ]

                        let inArray = ()=>{
                            for (let p of points){
                                if(candle.time.valueOf() == p) return true
                            }
                            return false
                        }
 
                        if(inArray() ){
                            console.log('----------------------------------')
                        }
                    }
                    dataChart[11].push("'"+timing+"'")
                    
                    if (start == null) start = candle.datetime;
                    end = candle.datetime;
                    if(endTime < candle.time) break
                }
                console.log("-------------------------------");
                let av = sampleav/slice.length
                let trend = ((slice[slice.length-1].close - slice[0].close) * 100) / slice[slice.length-1].close
                // Fin prueba
                let arr = [timing, period1+'|'+period2, transactions.total, trend.toFixed(2), total.toFixed(2), (total * 100/ Math.abs(trend)).toFixed(2)];
                table.push(arr)
                
                let report = {
                    testtime: new Date().toLocaleString(),
                    crypto: symbol,
                    slice: sl,
                    temp: timing,
                    params: period1+'|'+period2,
                    total: total,
                    start: start,
                    end: end,
                    high : high ,
                    low : low ,
                    av: av,
                    trend : trend,
                    fee: commisions,
                    trans: transactions,
                    records: count,
                    openOrder: lastOrderLong && lastOrderLong.close.time == null 
                    ? ((lastCandle.close*100/lastOrderLong.open.price)-100).toFixed(2) + '%'
                    : false
            };
            // Impresion de las respuestas ---------------------------
            console.log(table.toString());
            save && fs.appendFile("./db/tests.csv", arr.join(';').toString().replaceAll('.',',') + '\n', err => err)
            if (chart) server.ini(dataChart)
        }
    });
    }
}
}
