const fs = require("fs");
const SMA = require("../libs/Averages.js");
let sma = new SMA()

fs.readFile("./db/EMA.csv", "utf8", async (err, filedata) => {
  let rows = filedata.split('\n')
  console.log('SMA----------------------')
  for (let row of rows){
    let r = row.split(';')
    console.log(
      r[0],
      sma.calculate(parseFloat(r[0]),3)
      )
  } 
  //console.log('EMA----------------------')
  //console.log('valor // resultado // esperado')
  //for (let row of rows){
  //  let r = row.split(';')
  //  console.log(
  //    r[0] +'//',
  //    ema.calculate(parseFloat(r[0]),3) + '//',
  //    r[1]
//
  //    )
  //}

});
