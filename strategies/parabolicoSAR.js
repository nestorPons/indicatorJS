const {Order} = require("../libs/Order.js");
const trade = require("../libs/Trading.js");

let OPENPOSITION = function () {
    if (openposition != false) return false 
    return changeTrend() == -1  
}

let CLOSEPOSITION = function (candle) {
    return openposition && (candle.max > stoploss && candle.min<stoploss)
}

const AMOUNT = 1000
let id = 0
let startRecordTrade = false
let stoploss = 0
let openposition = false
let pos = null
let arrpos = [];
let rc = []
let periodos = 0
let trend = 0
let total = 0
let changeTrend = ()=>{
    return (trend < trade.SAR.trend.value) ? 1 : trend > trade.SAR.trend.value ? -1 : 0 
}
function test(data) {
    trade.SAR.value = 45678;
    trade.SAR.trend.value = 1;
    trade.SAR.acelerationFactor = 0.02;

    for (let candle of data){
       opeciones(candle, trade)
    }
    // inicio
    console.log("total=> ", total);
}
function opeciones(candle, trade) {
    trade.paravolicSAR({
        open: candle.apertura,
        close: candle.cierre,
        time: candle.tiempo,
        ... candle
    });

    // ABRIR POSICION
    if (OPENPOSITION()) {
        pos = new Order(candle.timestamp, candle.cierre, AMOUNT, 0);
        pos.id = id += 1
        startRecordTrade = true
        openposition = true
    }

    // registro de posiciones
    if (startRecordTrade) 
        rc.push(JSON.parse(JSON.stringify({
            ... trade.SAR,
            tiempo: candle.tiempo
        })))

    // Venta
    // if (trade.SAR.trend.value < last_candle.trend) {
    if (CLOSEPOSITION(candle)) {
        openposition = false

        pos.closePosition(candle.timestamp, stoploss);
        pos.periods = JSON.parse(JSON.stringify(rc))

        arrpos.push(pos);
        total += pos.profit.total;

        rc = []
        startRecordTrade = false
        periodos = 0
        console.log(pos.toJSON())
    }

    if (trade.SAR.trend.value == 1) {
        stoploss = trade.SAR.value
    }
    trend = trade.SAR.trend.value;

    return total
}
module.exports = {
    test
}
