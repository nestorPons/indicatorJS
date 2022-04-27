const fs = require("fs");
const math = require("mathjs");
// Config *********************
let timings = ['1m','3m','5m','15m','30m'];
timings = ['1m']
let symbols = ["BTCUSDT", "BNBUSDT", "LTCUSDT", "ETHUSDT"];

// *****************************
// console.clear() 
for (let symbol of symbols) {
    for(let timing of timings){
        if(timings.length > 1) chart = false
        fs.readFile(`./db/histories/${symbol}-${timing}.json`, "utf8", async (err, _data) => {
            let data = JSON.parse(_data);

            let values = data.data.map((v,i,a)=>{
                return a[i-1]? a[i-1].close * 100 / v.close : 0 
            })

            let vol = math.std(values)  

            console.log(values.length, symbol, timing,  vol)    
        })  
    }  
}