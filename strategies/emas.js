const {Order} = require("../libs/Order.js");
const Indicator = require("../libs/IndicatorJS.js");
const Data = require("../libs/Data.js");
const Candle = require("../libs/Candle.js");
const {SMA, EMA, WMA} = require("../libs/Averages.js")

var {isEqual, isNotNull, isNull, isNotEqual, isGreater, isInZone, isEmpty} = Indicator.filters

class Strategy{
    constructor(symbol, periods={}, createOrder = false, isTest = true){
        // Estrategia de emas

        this.logs = true
        this._symbol = symbol
        this.amount = 100
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
        this.ema1 = new EMA(periods.ema1, 1.5)
        this.ema2 = new EMA(periods.ema2,2)
        this.ema3 = new EMA(5,1.5)
        this.ema4 = new EMA(20,2)
    }

    /**
     * Cálculo del cruce de emas con aceleración
     * @param {this.ema} a 
     * @param {this.ema} b 
     * @returns [1|-1|0]
     */
    crossEmas(a, b){
        let alast = a.values.last(2)
        let blast = b.values.last(2)
        let g1 = (a.val+a.acc) - (b.val)
        let g2 = alast - (blast)
     
        return g1 > 0 && g2 < 0 ? 1 : g1  < 0 && g2 > 0 ? -1 : 0; 
    }
    async test(candle) {
        let op = null
        let cl = null
        if (!(candle instanceof Candle)) throw new Error("Candle no es una clase")
     
        this.ema1 = this.ema1.calculate(candle.price, candle)
        this.ema2 = this.ema2.calculate(candle.price, candle)
        this.ema3 = this.ema3.calculate(candle.price, candle)
        this.ema4 = this.ema4.calculate(candle.price, candle) 
    
        if (this.CLOSE_ORDER_SHORT(this.order.sell, candle)){
            this.order.sell.closePosition(this.closePrice, candle.time)
            let t = this.order.sell.profit.total
            this.logs && console.log(
                t > 0 ? 
                '\x1b[32m%s\x1b[0m':'\x1b[31m%s\x1b[0m',
                'CLOSE_LONG =>', 
                candle.time)
            cl = this.order.sell
            this.order.sell = null
        } 
        if (this.CLOSE_ORDER_LONG(this.order.buy, candle)){
            this.order.buy.closePosition(this.closePrice, candle.time)
            let t = this.order.buy.profit.total
            this.logs && console.log(
                t > 0 ? 
                '\x1b[32m%s\x1b[0m':'\x1b[31m%s\x1b[0m',
                'CLOSE_LONG =>', 
                candle.time)
            cl = this.order.buy
            this.order.buy = null
        } 
        if(this.createOrder){  
            // ESTRATEGIA DE LARGO ---------------------------------      
            if (this.OPEN_ORDER_LONG(this.order.buy, candle)){
                this.order.buy = new Order(this._symbol, this.amount, BUY, this.isTest)
                this.order.buy.openPosition(candle.close, candle.time)
                this.logs && console.log('OPEN_LONG=>',candle.time,'\x1b[31m%s\x1b[0m',candle.price , this.ema1.variance)
                op = this.order.buy
            }
            // ESTRATEGIA DE CORTO ------------------------------------------------
            if (this.OPEN_ORDER_SHORT(this.order.sell, candle)){
                this.order.sell = new Order(this._symbol, this.amount, SELL, this.isTest)
                this.order.sell.openPosition(candle.close, candle.time)
                this.logs && console.log('OPEN_SHORT=>',candle.time,'\x1b[31m%s\x1b[0m')
                op = this.order.sell
            }
        }

        return [op, cl, this]   
    }
    OPEN_ORDER_SHORT(order, candle){
        if (!isNull(order)) return false
        return true 
        && this.ema1.val != null
        && this.crossEmas(this.ema1, this.ema2) == -1
    }
    CLOSE_ORDER_SHORT(order, candle){

        if (isNull(order)) return false
        if (!order.isOpen()) return false

        this.closePrice = candle.close
        return true 
        && this.crossEmas(this.ema1, this.ema2) == 1
    }
    OPEN_ORDER_LONG(order, candle){
        if (!isNull(order)) return false
        return true 
        && this.ema1.val != null
        && this.crossEmas(this.ema1, this.ema2) == 1
    }
    CLOSE_ORDER_LONG(order, candle){

        if (isNull(order)) return false
        if (!order.isOpen()) return false

        this.closePrice = candle.close
        return true 
        && this.crossEmas(this.ema1, this.ema2) == -1
    }
}
module.exports = {Strategy}