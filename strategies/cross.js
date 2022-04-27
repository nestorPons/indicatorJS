const {Order} = require("../libs/Order.js");
const Indicator = require("../libs/IndicatorJS.js");
const Data = require("../libs/Data.js");
const math = require("mathjs");
const Candle = require("../libs/Candle.js");

var {isEqual, isNotNull, isNull, isNotEqual, isGreater, isInZone, isEmpty} = Indicator.filters
let orderBUY = null, orderSELL = null
let trade  = new Indicator()
let trade1 = new Indicator()
let trade2 = new Indicator()
let trade3 = new Indicator()
let trade4 = new Indicator()   
let trade5 = new Indicator()
let trade6 = new Indicator() 
let st = {
    name: 'CrossEmas',
    test: true,
    closePrice: 0,
    openPrice: 0, 
    prices: new Data(),
    ema1: {
        period:13,
        factor: 1.5,
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
        period: 55,
        factor: 1.5,
        val: null,
        acc: null,
        ob: null,
        data: new Data(),
        last: null
    },
    ema4: {
        period: 133,
        factor: 2,
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
function reset(){
    orderBUY = null
    orderSELL = null

    trade  = new Indicator()
    trade1 = new Indicator()
    trade2 = new Indicator()
    trade3 = new Indicator()
    trade4 = new Indicator()   
    st.prices.reset()        
    st.ema1.data.reset()
    st.ema2.data.reset()
    st.ema3.data.reset()
    st.ema4.data.reset()
}
function CLOSE_ORDER(order, candle){
    if (isNull(order)) return false
    if (!order.isOpen()) return falselow
    let sl = order._stoploss.value
    if (!isNull(sl) && (candle.high > sl && candle.low < sl)) {
        // ESTABLE EL PRECIO DE CIERRE DEL STOPLOSS
        st.closePrice = order._stoploss.value
        return true
    }else{
        st.closePrice = candle.close
    }

    if(order.side == SELL){
        return true 
            && isGreater(st.ema2.acc,-0.01)
            && isGreater(st.ema3.acc,-0.001)
            && isGreater(st.ema4.acc,-0.001)
    }else{
        
        if(isGreater(st.ema4.dist,4) && isGreater(-0.1,st.ema1.acc)) return true
        return true 
        && isGreater(st.ema2.val, st.ema4.val)
        && st.crossEmas(st.ema1,st.ema2) == -1
            
    }
}
function OPEN_ORDER_SHORT(order, candle){
    if (!isNull(order)) return false

    
    return false 
    && isGreater(st.ema4.val, st.ema2.val)
    && isGreater(st.ema4.dist, -1.5)
    && isGreater(-0.1,st.ema1.acc)
    && isGreater(-0.01,st.ema3.acc)
    && isGreater(-0.001, st.ema4.acc) 
}
function OPEN_ORDER_LONG(order, candle){
    if (!isNull(order)) return false
    return true
    && isGreater(candle.price, st.ema3.val)
    && st.crossEmas(st.ema1,st.ema3) == 1
    
}
async function test(symbol, amount, candle, createOrder = false, isTest = true) {
   
    st.test = isTest
    if (!(candle instanceof Candle)) throw "Candle no es una clase"
    let op = null, cl = null 

    st.prices.push(candle.price)

    function loadData(ema){
        ema.val = ema.data.last()
        ema.last = ema.data.last(2) 
        ema.dist = (candle.price - ema.val) * 100 / ema.val
        let data = ema.data.slice(-10)
        if(data && isNotNull(data[0])) ema.variance = math.variance(data )
        if (ema.last != null){
            ema.acc = (ema.val - ema.last) / 2
        }
    }
    trade.data.add(candle)
    st.adx = trade.simpleMediaAverage('adx',trade.ADX(),14)
    st.rsi = trade.simpleMediaAverage('rsi',trade.RSI(),14)
    st.bol = trade.bollinger()
    st.sar = trade.PSAR()
    st.bol.diff = (st.bol.high - st.bol.low) * 100 / candle.price
    st.macd = trade.MACD()

    st.ema1.data.push(trade1.exponentialMediaAverage('ema1',candle.price,st.ema1.period, st.ema1.factor))
    st.ema2.data.push(trade2.exponentialMediaAverage('ema2',candle.high,st.ema2.period, st.ema2.factor))         
    st.ema3.data.push(trade3.exponentialMediaAverage('ema3',candle.low,st.ema3.period, st.ema3.factor))
    st.ema4.data.push(trade4.exponentialMediaAverage('ema4',candle.price,st.ema4.period, st.ema4.factor))

    loadData(st.ema1)
    loadData(st.ema2)
    loadData(st.ema3)
    loadData(st.ema4)
    
    if (CLOSE_ORDER(orderSELL, candle)){
        orderSELL.closePosition(st.closePrice, candle.time)
        cl = orderSELL
        st.test && console.log('CLOSE_SHORT =>', candle.time, orderSELL.profit.total)
        orderSELL = null
    } 
    if (CLOSE_ORDER(orderBUY, candle)){
        orderBUY.closePosition(st.closePrice, candle.time)
        cl = orderBUY
        st.test && console.log( orderBUY.profit.total>0?'\x1b[32m%s\x1b[0m':'\x1b[31m%s\x1b[0m','CLOSE_LONG =>', candle.time, orderBUY.profit.total)
        orderBUY = null
    } 
    if(createOrder){  
        // ESTRATEGIA DE LARGO ---------------------------------      
        if (OPEN_ORDER_LONG(orderBUY, candle)){
            orderBUY = new Order(symbol, amount, BUY, isTest)
            createOrder && orderBUY.openPosition(candle.close, candle.time)
            st.test && console.log('OPEN_LONG=>',candle.time,'\x1b[31m%s\x1b[0m', st.bol.diff )
            op = orderBUY
        }
        // ESTRATEGIA DE CORTO ------------------------------------------------
        if (OPEN_ORDER_SHORT(orderSELL, candle)){
            orderSELL = new Order(symbol, amount, SELL, isTest)
            orderSELL.openPosition(candle.close, candle.time)
            st.test && console.log('\x1b[31m%s\x1b[0m','OPEN_SHORT=>',candle.time,'\x1b[31m%s\x1b[0m',st.ema4.dist)
            op = orderSELL
        }
    }
    // ESTABLECER APERTURAS Y CIERRES ------------------------------------------------------------------------
    if (isNotNull(orderBUY)){
        // orderBUY.setStoploss(st.sar)
    }


    return [op, cl, st]
    
}
module.exports = {test, reset}