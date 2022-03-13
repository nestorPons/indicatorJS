class Candle{
    constructor(data){
        if(typeof(data)=='object'){
            this._time  = new Date(data.time)
            this._open   = parseFloat(data.open)    || null    
            this._high   = parseFloat(data.high)    || null
            this._low    = parseFloat(data.low)     || null
            this._close  = parseFloat(data.close)   || null
        } else{
            this._time = null
            this._open = null
            this._high = null
            this._low = null
            this._close = null
        }
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
        return new Date(this._time)
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
}
module.exports = Candle