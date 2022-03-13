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
            trend: {
                value: 1,
                // Se guardan los valores de la tendencia
                db: {
                    max: new Data(),
                    min: new Data()
                }
            },
            // Factor de aceleración SAR
            startFactor: 0.02,
            // Factor de aceleración SAR
            acelerationFactor: 0.02,
            // Máximo alcanzable por el factor de aceleración SAR
            maxFA: 0.2,
            // Guardado del ultimó valor SAR computado
            extremePoint: 0.0,
            // Guardado del ultimo valor del factor de aceleración SAR
            af: 0.0,
            reset: ()=>{

            }
        }
    }
    get last(){
        return this.data.container.splice(-1)[0]
    }
    ini() { // Solo para el primer registro si tiene valores 0
        if (this.value == null) 
            this.paravolicSARini()
    }
    reset(candle) {
        this.value = this.extremePoint
        this.trend.value = this.trend.value == 1 ? -1 : 1
        this.af = this.startFactor
        this.trend.db.max = [candle.max]
        this.trend.db.min = [candle.min]
    }
    /**
     * 
     * @param {float,float,float,float, string} {apertura, cierre, máximo, mínimo, fecha}
     * @returns 
     */
    paravolicSAR(_data = null) {
        if (_data == null) 
            this.data.test() 
        else 
            this.data.push(_data)
            
        let result = 0.0
        let candle = this.data.last()
        // Establece el punto extremo
        let chEx = this.setExtremePoint()
        // Ajuste de la tendencia
        if (this.SAR.trend.value == 1) {
            (this.SAR.value > candle.high) && this.SAR.reset()
        } else {
            (this.SAR.value < candle.low) && this.SAR.reset() 
        }      

        this.color = this.SAR.trend.value == 1 ? this.green : this.red
        if (chEx){
            // El inicio de af es start
            if (this.af == 0) this.af = this.startFactor
            // Se recalcula el factor aceleración
            else {
                this.SAR.af += this.SAR.acelerationFactor
            }
            // Limitamos el factor al maximo permitido
            ( this.SAR.af> this.SAR.maxFA) && (this.SAR.af = this.SAR.maxFA)

        }
        // Calcula la SAR de la siguiete vela
        result = this.paravolicSARcalculate()

        // Rectificación del PUNTO EXTREMO en los cambios de tendencia con desfase con los min y max de la propia vela.
        // binace BTCUSDT en la vela 21/1/22 20:00
        if (this.SAR.trend.value == -1 && this.SAR.extremePoint > candle.low) 
            this.SAR.extremePoint = candle.low
         else if (this.SAR.trend.value == 1 && this.SAR.extremePoint< candle.high) this.SAR.extremePoint = candle.high
       
        return result
    } 
    /**
     * Asigna un SAR al primer registro
     */
    paravolicSARini(){
        let candle = this.data.last()
        let ca = candle.open
        let cc = candle.close
        let ch = candle.high
        let cl = candle.low

        // Si la vela es negativa SAR = max o si no SAR = min
        this.SAR.value  = ca> cc ? ch : cl
        this.SAR.trend.value = ca > cc ? -1 : 1
    }
    /**
     * Establece el punto extremo
     * @param {object} candle vala con los datos
     * @returns {bool} indica si ha establecido un nuevo punto extremo
     */
    setExtremePoint() {
        let c = this.data.last()
        let t = this.SAR.trend.value
        
        this.SAR.trend.db.max.push(c.high)
        this.SAR.trend.db.min.push(c.low)
        // Guarda el punto extremo para el siguiente cálculo
        let ep = this.SAR.extremePoint,
        lp = ep
        
        if (t == 1 && ep < c.high) 
        ep = Math.max(...this.SAR.trend.db.max.get())
        else if (t == -1 && ep > c.low) 
        ep = Math.min(...this.SAR.trend.db.min.get())
        
        this.SAR.extremePoint = ep

        return(ep > lp) ? 1 : (ep < lp) ? -1 : 0
    }
    /**
     * Cálculo del parabolic SAR
     * @returns {float} valor del parabólico
     */
    paravolicSARcalculate() {
        let sar = this.SAR.value
        this.SAR.lsar = sar
        let af = this.SAR.af
        let ep = this.SAR.extremePoint
        /*
        Si el precio está por encima del Parabolic SAR:
        Parabolic SARi= Parabolic SARi-1+ α*(Hi-1– Parabolic SARi-1)
        SAR Actual= SAR anterior + FA anterior (PE anterior – SAR anterior)
        */
        let afdiff = af * (ep - sar)
        let val = sar + afdiff

        if (this.SAR.trend.value == 1) {
            (val > this.candle.min) && (val = this.candle.min)
        } else {
            (val < this.candle.max) && (val = this.candle.max)
        }


        return this.SAR.value = val
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
        return t/data.length
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
