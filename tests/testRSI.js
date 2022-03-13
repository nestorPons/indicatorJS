const fs = require("fs");
const Indicator = require("../libs/IndicatorJS.js");
const Candle = require("../libs/Candle.js");
const indicator = new Indicator()

fs.readFile("./db/RSI.csv", "utf8", async (err, filedata) => {
  let rows = filedata.split('\n')
  rows.shift()
  for (let row of rows){
    let cells = row.split(';') 
    const c = new Candle()
    c.time = cells[0]
    c.close = cells[4]
    indicator.data.add(c)
    let l = cells[cells.length-1]
    let i = indicator.RSI() != null ? indicator.RSI().toFixed(2) : null 
    let p = l != null ? parseFloat(cells[cells.length-1]).toFixed(2) : null
    console.log(i == p)
  }
});