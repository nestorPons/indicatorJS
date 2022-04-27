const {Order} = require("../libs/Order.js");
const Indicator = require("../libs/IndicatorJS.js");
const Data = require("../libs/Data.js");
const math = require("mathjs");
const Candle = require("../libs/Candle.js");
const {SMA, EMA, WMA} = require("../libs/Averages.js")

var {isEqual, isNotNull, isNull, isNotEqual, isGreater, isInZone, isEmpty} = Indicator.filters

class Trends{
    constructor(symbol, amount, createOrder = false, isTest = true){
        this.logs = true
        this._symbol = symbol
        this._amount = amount
        this.trade  = new Indicator()
        this.createOrder = createOrder
        this.isTest = isTest
        this.data = new Data(20)
        this.order = {
            buy: null,
            sell:null,
            price: {
                open: null,
                close: null
            } 
        }
        this.st = {}
        this.setIndicators()

        this.distance = {
            status : false,
            value: 0
        } 
    }
    setIndicators(){
        this.ema1 = new EMA(8,2)
        this.ema2 = new EMA(13,2)
        this.ema3 = new EMA(5,1.5)
        this.ema4 = new EMA(89,2)
    }
    /**
     * Cálculo del cruce de emas con aceleración
     * @param {this.ema} a 
     * @param {this.ema} b 
     * @returns [1|-1|0]
     */
    crossEmas(a, b){
        a.last = a.data.last(2)
        b.last = b.data.last(2)
        let g1 = a.val - b.val
        let g2 = a.last - b.last
    
        return g1 > 0 && g2 < 0 ? 1 : g1  < 0 && g2 > 0 ? -1 : 0; 
    }
    async test(candle) {
        let op = null
        let cl = null
        if (!(candle instanceof Candle)) throw new Error("Candle no es una clase")
     
        this.trade.data.add(candle)
        
        this.st.adx = this.trade.ADX()
        this.st.rsi = this.trade.RSI(21+15)
        this.st.bol = this.trade.bollinger()
        this.st.sar = this.trade.PSAR()
        this.st.vix = this.trade.VIX()
        this.st.bol.diff = (this.st.bol.high - this.st.bol.low) * 100 / candle.price
        this.st.macd = this.trade.MACD()
        this.st.sto = this.trade.stochastic()
        this.st.stot = {
            up: this.trade.stochastic() >95 ? candle.close : null,
            down: this.trade.stochastic() < 5 ? candle.close : null,
        }
        let data = this.trade.data.get(10).map(c=>c.price)
        this.st.variance = math.variance(data)
        
        let valueEma4 = this.trade.data.last(5)?candle.price-this.trade.data.last(5).price + candle.price:null
        this.ema1 = this.ema1.calculate(candle.high, candle)
        this.ema2 = this.ema2.calculate(candle.low, candle)
        this.ema3 = this.ema3.calculate(valueEma4, candle)
        this.ema4 = this.ema4.calculate(candle.price, candle) 
    

        if (this.CLOSE_ORDER_SHORT(this.order.sell, candle)){
            this.order.sell.closePosition(this.st.closePrice, candle.time)
            orderSHORT = this.order.sell
            this.logs && console.log('CLOSE_SHORT =>', candle.time, this.order.sell.profit.total)
            this.order.sell = null
        } 
        if (this.CLOSE_ORDER_LONG(this.order.buy, candle)){
            this.order.buy.closePosition(this.st.closePrice, candle.time)
            let t = this.order.buy.profit.total
            this.logs && console.log(
                t > 0 ? 
                '\x1b[32m%s\x1b[0m':'\x1b[31m%s\x1b[0m',
                'CLOSE_LONG =>', 
                candle.time)
            cl = this.order.buy
            this.order.buy = null
            this.distance.status = false
        } 
        if(this.createOrder){  
            // ESTRATEGIA DE LARGO ---------------------------------      
            if (this.OPEN_ORDER_LONG(this.order.buy, candle)){
                this.order.buy = new Order(this._symbol, this._amount, BUY, this.isTest)
                this.order.buy.openPosition(candle.close, candle.time)
                this.logs && console.log('OPEN_LONG=>',candle.time,'\x1b[31m%s\x1b[0m',candle.price , this.ema1.variance)
                op = this.order.buy
            }
            // ESTRATEGIA DE CORTO ------------------------------------------------
            if (this.OPEN_ORDER_SHORT(this.order.sell, candle)){
                this.order.sell = new Order(this._symbol, this._amount, SELL, this.isTest)
                this.order.sell.openPosition(candle.close, candle.time)
                this.logs && console.log('OPEN_SHORT=>',candle.time,'\x1b[31m%s\x1b[0m')
                op = this.order.sell
            }
        }
        // ESTABLECER APERTURAS Y CIERRES ------------------------------------------------------------------------
        if (isNotNull(this.order.buy)){
            //this.order.buy.setStoploss(this.ema4.val)
        }
        this.st.ema1 = this.ema1
        this.st.ema2 = this.ema2
        this.st.ema3 = this.ema3
        this.st.ema4 = this.ema4
        return [op, cl, this.st]   
    }
    CLOSE_ORDER_SHORT(order, candle){
        if (isNull(order)) return false
        if (!order.isOpen()) return false
        let sl = order._stoploss.value
        if (!isNull(sl) && (candle.high > sl && candle.low < sl)) {
            // ESTABLE EL PRECIO DE CIERRE DEL STOPLOSS
            this.st.closePrice = order._stoploss.value
            return true
        }else{
            this.st.closePrice = candle.close
        }
        return true 
            && isGreater(this.ema2.acc,-0.01)
            && isGreater(this.ema3.acc,-0.001)
            && isGreater(this.ema4.acc,-0.001)

    }
    OPEN_ORDER_SHORT(order, candle){
        // NO PUEDE HABER OTRA COMPRA ACTIVA
    
        if (!isNull(order)) return false
    
        return false 
        && isGreater(this.ema4.val, this.ema2.val)
        && isGreater(this.ema4.dist, -1.5)
        && isGreater(-0.1,this.ema1.acc)
        && isGreater(-0.01,this.ema3.acc)
        && isGreater(-0.001, this.ema4.acc) 
    }
    OPEN_ORDER_LONG(order, candle){
        if (!isNull(order)) return false
        return true 
        && this.ema4.val != null
        && this.ema4.acc > 0 
        && candle.close > this.ema4.val
     }
    CLOSE_ORDER_LONG(order, candle){

        if (isNull(order)) return false
        if (!order.isOpen()) return false
        let sl = order._stoploss.value
        if (!isNull(sl) && (candle.high > sl && candle.low < sl)) {
            this.logs && console.log('STOP_LOSS')
            // ESTABLE EL PRECIO DE CIERRE DEL STOPLOSS
            this.st.closePrice = order._stoploss.value
            return true
        }else{
            this.st.closePrice = candle.close
        }


        return true 
        && candle.close < this.ema4.val


    }
}
module.exports = {Trends}