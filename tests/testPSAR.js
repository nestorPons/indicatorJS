const fs = require("fs")
const IndicatorJS = require("../libs/IndicatorJS.js")
const Candle = require("../libs/Candle.js")
const indicator = new IndicatorJS()


fs.readFile("./db/PSAR.csv", "utf8", async (err, filedata) => {

  let rows = filedata.split('\n')
  let title = rows.shift()
  console.log(title)
  let result = []
  for (let row of rows){
    let cells = row.split(';')

    console.log(indicator.paravolicSAR(new Candle({ 
      date:   new Date(),
      //open:   parseFloat(cells[1]),
      high:   parseFloat(cells[1]),
      low:    parseFloat(cells[2]),
    })))
  }
  console.log(cells)
  process.exit()
  console.log("-------------------------------")
  console.log(result)
})
