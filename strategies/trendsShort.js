const {Order} = require("../libs/Order.js");
const Indicator = require("../libs/IndicatorJS.js");
const Data = require("../libs/Data.js");
const math = require("mathjs");
let {isEqual, isNotNull, isNull, isNotEqual, isGreater, isInZone, isEmpty} = Indicator.filters
let orderBUY = null, orderSELL = null
let total = 0 
let lastCandle = {price:null}
const trade  = new Indicator()
const trade1 = new Indicator()
const trade2 = new Indicator()
const trade3 = new Indicator()
const trade4 = new Indicator()   
const st = {
    name: 'CrossEmas',
    data: [],
    closePrice: 0,
    openPrice: 0, 
    ema1: {
        period:21,
        factor: 2,
        last: null,
        val: null,
        acc: null,
        ob: null,
        data: new Data()
    },
    ema2: {
        period: 55,
        factor: 1.5, 
        last: null,
        val: null,
        acc: null,
        ob: null,
        data: new Data()
    },
    ema3: {
        period: 133,
        factor: 2,
        val: null,
        acc: null,
        ob: null,
        data: new Data(),
        last: null
    },
    ema4: {
        period: 244,
        factor: 2.2,
        last: null,
        val: null,
        acc: null,
        ob: null,
        data: new Data()
    },
    /**
     * 
     * @param {st.ema} a 
     * @param {st.ema} b 
     * @returns [1|-1|0]
     */
    crossEmas: (a, b)=>{
        let g1 = (a.val + a.acc) - b.val
        let g2 = a.last - (b.last - b.acc)
  
        return g1 > 0 && g2 < 0 ? 1 : g1  < 0 && g2 > 0 ? -1 : 0; 
    },
}
function CLOSE_ORDER(order, candle){
    if (isNull(order)) return false
    if (!order.isOpen()) return false
    st.closePrice = candle.close
    let sl = order._stoploss.value
    if (!isNull(sl) && (candle.high > sl && candle.low < sl)) {
        //console.log('=====>CIERRE POR STOPLOSS',order._stoploss.value )
        // ESTABLE EL PRECIO DE CIERRE DEL STOPLOSS
        st.closePrice = order._stoploss.value
        return true
    }

    if(order.side == SELL){
        return true 
            //&& isEqual(st.crossEmas(st.ema2,st.ema3), -1) 
            //&& isGreater(0.1,st.ema1.acc)
            && isGreater(st.ema2.acc,-0.01)
            && isGreater(st.ema3.acc,-0.001)
            && isGreater(st.ema4.acc,-0.001)
    }
}
function OPEN_ORDER(order, candle){
    // NO PUEDE HABER OTRA COMPRA ACTIVA
    if (!isNull(order)) return false
        return true
            && isGreater(st.ema4.val, candle.price)
            && isGreater(-0.1,st.ema1.acc)
            && isGreater(-0.01,st.ema2.acc)
            && isGreater(-0.01,st.ema3.acc)
            && isGreater(0, st.ema4.acc)  

}
async function test(symbol, amount, candle, createOrder = false, isTest = true) {
    let op = null, cl = null 
    candle.order = null
    candle.price = (candle.high + candle.low) / 2 || null

    function loadData(ema){
        ema.val = ema.data.last()
        ema.last = ema.data.last(2) 
        ema.dist = (candle.price - ema.val) * 100 / candle.price

        if (ema.last != null){
            ema.acc = ema.val - ema.last
        }
    }
    trade.data.add(candle)
    st.adx = trade.simpleMediaAverage('adx',trade.ADX(),14)
    st.rsi = trade.simpleMediaAverage('rsi',trade.RSI(),14)
    st.bol = trade.bollinger()
    st.sar = trade.PSAR()
    st.bol.diff = (st.bol.high - st.bol.low) * 100 / candle.price
    st.macd = trade.MACD()
    // para cierres

    // st.ema2.data.push(trade2.simpleMediaAverage('ema2',(candle.high-candle.low)+candle.open,st.ema2.period))    
    st.ema1.data.push(trade1.exponentialMediaAverage('ema1',candle.high,st.ema1.period, st.ema1.factor))
    st.ema2.data.push(trade2.exponentialMediaAverage('ema2',candle.low,st.ema2.period, st.ema2.factor))         
    st.ema3.data.push(trade3.exponentialMediaAverage('ema3',candle.price,st.ema3.period, st.ema3.factor))
    st.ema4.data.push(trade4.exponentialMediaAverage('ema4',candle.price,st.ema4.period, st.ema4.factor))
    
    loadData(st.ema1)
    loadData(st.ema2)
    loadData(st.ema3)
    loadData(st.ema4)


    // Importante velocidad antes de guardar historia
    // v = (vf-vi)/t-vi
        if (CLOSE_ORDER(orderSELL, candle)){
            orderSELL.closePosition(st.closePrice, candle.time)
            //console.log('CIERRE=>',candle.time, orderSELL.result.diff)
            cl = orderSELL
            orderSELL = null
        } 
        if(createOrder){  

            // ESTRATEGIA DE LARGO ---------------------------------
        
            
            // ESTRATEGIA DE CORTO ------------------------------------------------
            if (OPEN_ORDER(orderSELL, candle)){
                orderSELL = new Order(symbol, amount, SELL, isTest)
                orderSELL.openPosition(candle.close, candle.time)
                op = orderSELL
            }
        }
        // ESTABLECER APERTURAS Y CIERRES ------------------------------------------------------------------------
        if (isNotNull(orderSELL)){
            
            //orderSELL.setStoploss(st.ema4.val)  
            
        }

    lastCandle = candle
    return {order:op, b:cl, c:st}
    
}
module.exports = {test}