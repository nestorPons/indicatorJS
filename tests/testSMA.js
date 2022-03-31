const fs = require("fs");
const Indicator = require("../libs/IndicatorJS.js");
let indicator = new Indicator()

fs.readFile("./db/EMA.csv", "utf8", async (err, filedata) => {
  let rows = filedata.split('\n')
  console.log('SMA----------------------')
  for (let row of rows){
    let r = row.split(';')
    console.log(
      r[0],
      indicator.simpleMediaAverage(parseFloat(r[0]),3)
      )
  }
});
