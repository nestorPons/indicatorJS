const Data = require('./Data.js')
class IndicatorJS {
    constructor(){
        this.period = 14
        // Valores para calcular EMA y SMA
        this.EMA = { // Suavizado EMA a mayor numero mayor peso en los datos más recientes
            softened: 2,
            // Periodos que calcular
            period: 20,
            data: new Data(),
            emas: new Data(),
            acc: new Data()
        }
        this.SMA = {
            data: new Data()
        }
        this._TR = {
            data: [],
            last: null,
            max: 0, 
            val: 0
        }
        this.data = new Data()
        // Parametros para loscalculos del SAR
        this.SAR = {
            value: null,
            // Sar utilizado para realizar las operaciones
            lsar: null,
            // Máximo/minimo valor de la vela anterior
            // MArcador de tendencia +1 y -1
            trend: 1,
            min: new Data(),
            max: new Data(),
            // Factor de aceleración SAR
            startFactor: 0.02,
            // Factor de aceleración SAR
            acelerationFactor: 0.02,
            // Máximo alcanzable por el factor de aceleración SAR
            maxFA: 0.2,
            epsar: 0, 
            // Punto extremo anterior
            extremePoint: 0.0,
            // Guardado del ultimo valor del factor de aceleración SAR
            af: 0,
            /**
             * Resetea parametros del PSAR
             * @param {Candle} candle 
             */
            reset(candle) {
                this.value = this.extremePoint
                this.trend *= -1
                this.af = 0
                this.max = new Data(candle)
                this.min = new Data(candle)
            },    
            /**
            * Asigna un SAR al primer registro
            */
            ini(candle){
               let ca = candle.open 
               let cc = candle.close
       
               // Si la vela es negativa SAR = max o si no SAR = min
               this.value  = ca > cc ? candle.high : candle.low
               this.trend = ca > cc ? -1 : 1
            }
        }
    }
    get last(){
        return this.data.container.splice(-1)[0]
    }
    /**
     * Cálculo de la parabólica SAR
     * @param {Candle} 
     * @returns {Float}  this.SAR.reset(candle)
     */
    PSAR(_data = null) {
        if (_data == null) this.data.test() 
        else this.data.push(_data)
        let candle = this.data.last()
        // Inicialización
        if (this.SAR.value == null) this.SAR.ini(candle)
        if(candle.low < this.SAR.value && candle.high > this.SAR.value){
            this.SAR.reset(candle)
        }
        this.SAR.max.push(candle.high)
        this.SAR.min.push(candle.low)
        let ep = null
 
        if(this.SAR.trend == 1){
            ep = this.SAR.max.max()
            let min1 = this.SAR.min.last(2) || this.SAR.value
            let min2 = this.SAR.min.last(3) || this.SAR.value
            this.SAR.value = Math.min(min1, min2, this.SAR.value)
        }else{
            ep = this.SAR.min.min() 
            let max1 = this.SAR.max.last(2) || this.SAR.value
            let max2 = this.SAR.max.last(3) || this.SAR.value
            this.SAR.value = Math.max(max1, max2, this.SAR.value) 
        }
        if(this.SAR.extremePoint != ep){
            this.SAR.af += this.SAR.af == 0? this.SAR.startFactor : this.SAR.acelerationFactor
            if (this.SAR.af > this.SAR.maxFA) this.SAR.af = this.SAR.maxFA
        }
        this.SAR.value = this.SAR.value + this.SAR.af * (ep - this.SAR.value)
        this.SAR.extremePoint = ep

        return this.SAR.value
    } 
    /**
     * Medias Móviles
     * @param {array|integer|null} data numeros de los que extraer una media simple 
     * @param {int|null} period periodo de la media 
     * @returns {integer} con la media del último elemento
     */
    simpleMediaAverage(_data = null, _period = null) {
        let t = 0
        if (_data == null) 
            for(let candle of this.data.get()){
                this.SMA.data.push(candle.close) 
            }
        else if(Array.isArray(_data))
            this.SMA.data = _data
        else 
            this.SMA.data.push(_data)

        let period = _period || this.SMA.data.length
        let data = this.SMA.data.slice(period*-1)
        
        for (let d of data){
            t += parseFloat(d)
        }
        let r = data.length >= period ? t/data.length : null  
        return r
    } 
    ADX(period = this.period) {
        let dm1s = 0
        let dm2s = 0
        let candle =  this.data.last() || {ADX :{val: null, max: null}}
        let lastCandle = this.data.last(2)
        let tr = this.TR(period)
        
        if (candle.ADX == undefined) 
            candle.ADX = {
                dm1: 0, dm2: 0, dm1s: 0, dm2s: 0, di1s: 0, di2s: 0, diabs: 0, dx: 0, val: 0
            }
        
        if (lastCandle != null) {
            let cm = candle.high - lastCandle.high
            let rm = lastCandle.low - candle.low
            candle.ADX.dm1 = cm> rm ? Math.max(cm, 0) : 0
            candle.ADX.dm2 = rm > cm ? Math.max(rm, 0) : 0

            if (this.data.container.length<= period) {
                dm1s += candle.ADX.dm1
                dm2s += candle.ADX.dm2
                candle.ADX.dm1s = dm1s
                candle.ADX.dm2s = dm2s
            } else {
                // TR14 = (13 / 14 ) * Anterior TR14  + TR1 actual / 14
                candle.ADX.dm1s = lastCandle.ADX.dm1s -(lastCandle.ADX.dm1s / period) + candle.ADX.dm1
                candle.ADX.dm2s = lastCandle.ADX.dm2s -(lastCandle.ADX.dm2s / period) + candle.ADX.dm2
                candle.ADX.di1s = 100 * (candle.ADX.dm1s / tr)
                candle.ADX.di2s = 100 * (candle.ADX.dm2s / tr)
                candle.ADX.diabs = Math.abs(candle.ADX.di1s - candle.ADX.di2s)
                candle.ADX.dx = 100 * (candle.ADX.diabs / (candle.ADX.di1s + candle.ADX.di2s))
                // Suavizado de dx
                if (this.data.len() <= (period * 2)) {
                    candle.ADX.val += (candle.ADX.dx / period)
                } else {
                    candle.ADX.val = ((lastCandle.ADX.val * (period - 1)) + candle.ADX.dx) / period
                }
            }
        }
        return candle.ADX.val
    } 
    /**
     * cálculo del verdadero rango
     * @param {Integer} period 
     * @param {high, low, close} _data 
     * @returns 
     */
    TR(period = 14) {
        let candle = this.data.last() || {TR :{val: null, max: null}}
        let lastCandle = this.data.last(2)
        let data = this.data.get()
        let v1, v2, v3
        if (candle != undefined && candle.TR == undefined)
            candle.TR = {val: null, max: null, }

        if (lastCandle != null) {
            v1 = candle.high - candle.low
            v2 = candle.high - lastCandle.close
            v3 = lastCandle.close - candle.low
            candle.TR.max = Math.max(v1, v2, v3) || 0
            // alisado de Wilder
            if (this.data.container.length<= (period + 1)){
                for(let last of data){
                    candle.TR.val += last.TR.max 
                }
            }else{
                // TR14 = (13 / 14 ) * Anterior TR14  + TR1 actual / 14
                candle.TR.val = lastCandle.TR.val-(lastCandle.TR.val/period)+candle.TR.max
            }
        } 
        this.data.container.push(candle)

        return  candle.TR.val 
    } 
    /**
     * 
     * @param {*} data 
     * @param {*} period 
     * @param {*} softened 
     * @returns 
     */
    exponentialMediaAverage(_data, period, smooth=2){  
        let ema = null
        let last = null
        if (_data == null) 
            for(let candle of this.data.get()){
                this.EMA.data.push(candle.close) 
            }
        else if(Array.isArray(_data))
            this.EMA.data = _data
        else 
            this.EMA.data.push(_data)


        if(this.EMA.data.len() >= period){
            let slice = this.EMA.data.slice(period*-1)
            last = this.EMA.emas.last(1) 
            if(last == null){
                ema = this.simpleMediaAverage(slice)
            } else{
                let [price] = slice.slice(-1)
                let fa = smooth/(period + 1)
                //ema = (p * fa) + (last * (1-fa))        
                ema = last + fa*(price-last)
            }
        }
        
        this.EMA.emas.push(ema)
        this.EMA.acc.push((ema-last)/2)
        return ema     
    } 
    RSI(period = this.period){
        this.data.test()
        let len = period + 1
        let rsi = null
        
        let data = this.data.slice(len * -1)
        if(data.length >= len){
            let last = null
            let pos = 0
            let neg = 0
            // Calculo RS
            
            for(let d of data){
                if(last!=null){
                    if(d.close > last > 0) pos += (d.close - last)
                    else neg += (last - d.close)
                }
                last = d.close
            }
            let ms = pos / period
            let mb = neg / period
            let rs = ms / mb
            rsi = 100-100/(1+rs) || null
        }
        return rsi 

    }
    static filters = {
        error: true, 
        isEqual(a, b, factor = 0){
            return (a + factor) ==b 
        }, 
        isNotEqual(a, b){
            return  a!=b 
        }, 
        isNull(a){
            return a==null         
        }, 
        isNotNull(a){
            let r = true
            for(let a of arguments) r = r && a != null
            return r           
        }, 
        isGreater(a, b, factor = 0 ){
            return (a + factor)>b
        }, 
        isInZone(a, b, factor){
            factor = (factor*b)/100 
            let z1 = b + factor
            let z2 = b - factor
            return (a >= z2 && a <= z1)      
        },
        isEmpty(a) {
            return a == null || a == 'NaN' || a == 'undefined'
        }
    }

}
module.exports = IndicatorJS
