const fs = require("fs")
const IndicatorJS = require("../libs/IndicatorJS.js")
const Candle = require("../libs/Candle.js")
const { exit } = require("process")
const indicator = new IndicatorJS()


fs.readFile("./db/ATR.csv", "utf8", async (err, filedata) => {

  let rows = filedata.split('\n')
  let title = rows.shift()
  console.log(title)
  let result = []
  for (let row of rows){
    let cells = row.split(';')
    indicator.data.add(new Candle({ 
        date:   cells[0],
        open:   parseFloat(cells[1]),
        high:   parseFloat(cells[2]),
        low:    parseFloat(cells[3]),
        close:  parseFloat(cells[4]),
      })
    )
    console.log(cells[8], indicator.ATR())
  }
  console.log("-------------------------------")
  console.log(result)
})
