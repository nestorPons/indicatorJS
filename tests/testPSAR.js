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
    indicator.data.add(new Candle({ 
      date:   new Date(),
      //open:   parseFloat(cells[1]),
      high:   parseFloat(cells[1]),
      low:    parseFloat(cells[2]),
    }))
    console.log(indicator.paravolicSAR(), '|||',cells[9])
  }
  console.log("-------------------------------")
  console.log(result)
})
