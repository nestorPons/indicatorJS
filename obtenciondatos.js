const Binance = require("node-binance-api");
const binance = new Binance().options({
  APIKEY: process.env.BINANCEAPIKEY,
  APISECRET: process.env.BINANCEAPIKEYSECRET,
});
const fs = require("fs");

let symbols = ["BTCUSDT", "BNBUSDT", "LTCUSDT", "ETHUSDT"];
// Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
let timings = ["1m","3m","5m","15m","30m"];
let loops = 9
let nloops = [];
let fechafin = new Date();

(async function(){
  try {
    for (let symbol of symbols) {
      fechafin = new Date();
      for (let timing of timings) {
        let file_data = `./db/histories/${symbol}-${timing}.json`;
        nloops[timing] = 0  
        const result = [...await getData(symbol, timing)]
        fs.writeFile(file_data,     
          JSON.stringify({
          symbol: symbol,
          timing: timing,
          data: result,
        }), (e) => e);
      }
    }
  } catch (err) {
    console.log(err);
  }
})()

async function getData(symbol, timing, data= []) {
  return new Promise((resolve, reject) => {
    binance.candlesticks(symbol,timing,async (error, ticks, symbol) => {
      if (error){ 
        console.error('No se ha cargado =>' , symbol)        
        reject(error); 
      }
      fechafin = setFechaFin(ticks[0][0], timing);
      const candlesData = await ticks.map(c => ({
        time: parseInt(c[0]),
        datetime: new Date(c[0]).toLocaleString(),
        open: parseFloat(c[1]),
        close: parseFloat(c[2]),
        high: parseFloat(c[3]),
        low: parseFloat(c[4]),
        volume: parseFloat(c[5]),
        closeTime: parseFloat(c[6]),
        trades: parseFloat(c[7]),
        assetVolume: parseFloat(c[8]),
        buyBaseVolume: parseFloat(c[9]),
        buyAssetVolume: parseFloat(c[10]),
        ignored: c[11]
      }))
      let dataresolve = [...data, ...candlesData]

      console.log(symbol + " " + timing + " " + fechafin.toLocaleString());
      if (nloops[timing] < loops){
        nloops[timing]++
        dataresolve = await getData(symbol, timing, dataresolve);
      }
      dataresolve.sort(function (a, b) {
        return parseInt(a.time) - parseInt(b.time)
      });
      resolve(dataresolve)
    },
    {
      limit: 1000,
      endTime: fechafin.getTime(),
    });
  })
}
function setFechaFin(datestamp, timing){
  let date = new Date(datestamp)
  switch(timing){
    case '1m': 
    result = date.setMinutes(date.getMinutes()-1) 
    break;
    case '3m': 
    result = date.setMinutes(date.getMinutes()-3) 
    break;
    case '5m': 
    result = date.setMinutes(date.getMinutes()-5) 
    break;
    case '15m': 
    result = date.setMinutes(date.getMinutes()-15) 
    break;
    case '30m': 
    result = date.setMinutes(date.getMinutes()-30) 
    break;
    case '1h': 
    result = date.setHours(date.getHours()-1) 
    break;
    case '2h': 
    result = date.setHours(date.getHours()-2) 
    break;
    case '4h': 
    result = date.setHours(date.getHours()-4) 
    break;   
    case '6h': 
    result = date.setHours(date.getHours()-6) 
    break;
    case '8h': 
    result = date.setHours(date.getHours()-8) 
    break;
    case '12h': 
    result = date.setHours(date.getHours()-12) 
    break;
    case '1d': 
    result = date.setDay(date.getDay()-1) 
    break;
    case '3d': 
    result = date.setDay(date.getDay()-3)  
    break;
    case '1w': 
    result = date.setDay(date.getDay()-7) 
    break;
    case '1M': 
    result = date.setMonth(date.getMonth()-1) 
    break; 
  }

  return date
}