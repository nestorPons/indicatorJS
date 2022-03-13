const fs = require("fs")
const Trading = require("../libs/Trading.js")


fs.readFile("./db/ADX-3.csv", "utf8", async (err, filedata) => {
  let trade = new Trading()
  let rows = filedata.split('\n')
  let result = []
  for (let row of rows){
    let cells = row.split(';')
    trade.add({ 
      date:   cells[0],
      //open:   parseFloat(cells[1]),
      high:   parseFloat(cells[1]),
      low:    parseFloat(cells[2]),
      close:  parseFloat(cells[3]),
    }
    )
    result.push(trade.ADX())

  }
  
  console.log("-------------------------------")
  console.log(result)
})
