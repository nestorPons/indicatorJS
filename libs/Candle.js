class Candle{
    constructor(data){
        if(typeof(data)=='object'){
            this._time  = new Date(data.time)
            this._closeTime = new Date(data.closeTime)
            this._open   = parseFloat(data.open)    || null    
            this._high   = parseFloat(data.high)    || null
            this._low    = parseFloat(data.low)     || null
            this._close  = parseFloat(data.close)   || null
            this._volume =  parseFloat(data.volume) || null
            this._quoteVolume =  parseFloat(data.quoteVolume) || null
            this._takerBuyBaseVolume =  parseFloat(data.takerBuyBaseVolume) || null
            this._takerBuyQuoteVolume = parseFloat(data.takerBuyQuoteVolume) || null
            this._trades = parseInt(data.trades)
            this._price = (this._high + this.close) / 2
            this._pp = (data.high + data.low + data.price) / 3 || null
            this._R1 = (this.pp*2)-data.low
            this._S1 = (this.pp*2)-data.high
            this._R2 = this.pp+(this.R1-this.S1)
            this._S2 = this.pp-(this.R1-this.S1)
        }else{
            throw new Error("No ha introducido los datos necesarios para crear la vela")
        }
    }
    get S2(){
        return this._S2
    }
    get R2(){
        return this._R2
    }
    get S1(){
        return this._S1
    }
    get R1(){
        return this._R1
    }
    get pp(){
        return this._pp
    }
    get closeTime(){
        return this._closeTime
    }
    get price (){
        return this._price
    }
    get open(){
        return this._open
    }
    get high(){
        return this._high
    }
    get low(){
        return this._low
    }
    get close(){
        return this._close
    }
    get time(){
        return this._time
    }
    get datetime(){
        return new Date(this._time).toLocaleString()
    }
    get timestamp(){
        return this.time.getTime()
    }
    set time(value){
        this._time = new Date(value)
    }
    set open(value){
        this._open = parseFloat(value)
    }
    set high(value){
        this._high = parseFloat(value)
    }
    set low(value){
        this._low = parseFloat(value)
    }
    set close(value){
        this._close = parseFloat(value)
    }
    set price(value){
        this._price = parseFloat(value)
    }
}
module.exports = Candle