const Data = require("./Data.js");
const math = require("mathjs");

class IndicatorJS {
  constructor() {
    this.period = 14;
    this.data = new Data();
    this.ema = {
      softened: 2,
      // Periodos que calcular
      period: 20,
      data: new Data(),
      emas: new Data(),
      acc: new Data(),
    };
    this.sma = {
      data: new Data(),
      acc: new Data(),
    };
    this.tr = {
      data: new Data(),
      last: null,
      max: 0,
      val: 0,
    };
    this.sd = {
      data: new Data(),
    };
    this.sar = {
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
      acelerationFactor: 0.06,
      // Máximo alcanzable por el factor de aceleración SAR
      maxFA: 0.4,
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
        this.value = this.extremePoint;
        this.trend *= -1;
        this.af = 0;
        this.max = new Data(candle);
        this.min = new Data(candle);
      },
      /**
       * Asigna un SAR al primer registro
       */
      ini(candle) {
        let ca = candle.open;
        let cc = candle.close;

        // Si la vela es negativa SAR = max o si no SAR = min
        this.value = ca > cc ? candle.high : candle.low;
        this.trend = ca > cc ? -1 : 1;
      },
    };
    this.tr = {
      val: null,
      max: null,
      data: new Data(14),
    };
    this.atr = {
      val: null,
    };
    this.adx = {
      _dxt: 0,
      _dm1s: 0,
      _dm2s: 0,
      val: null,
      data: new Data()
    };
    this.vix = {
      data: new Data(),
    }
  }
  /**
   *  Identificar la fuerza de una tendencia potencial
   * @param {int} period
   * @returns {float|null}
   */
  ADX(period = 14) {
    if (this.data.len() < period) return null
    let dm1s = 0;
    let dm2s = 0;
    let candle = this.data.last();
    let lastCandle = this.data.last(2);
    let last = Object.assign({}, this.adx);
    let tr = this.ATR(period);
    let dm1 = null;
    let dm2 = null;

    if (lastCandle != null) {
      let cm = candle.high - lastCandle.high;
      let rm = lastCandle.low - candle.low;
      dm1 = cm > rm ? Math.max(cm, 0) : 0;
      dm2 = rm > cm ? Math.max(rm, 0) : 0;
      
      if (this.data.container.length <= period) {
        dm1s += dm1;
        dm2s += dm2;
        this.adx._dm1s = dm1s;
        this.adx._dm2s = dm2s;
      } else {
        // TR14 = (13 / 14 ) * Anterior TR14  + TR1 actual / 14
        this.adx._dm1s = last._dm1s - last._dm1s / period + dm1;
        this.adx._dm2s = last._dm2s - last._dm2s / period + dm2;
        let di1s = 100 * (this.adx._dm1s / tr);
        let di2s = 100 * (this.adx._dm2s / tr);
        let diabs = Math.abs(di1s - di2s);

        let dx = 100 * (diabs / (di1s + di2s));
        // Suavizado de dx
        if (this.data.len() <= period * 2) {
          this.adx._dxt += dx;
        } else {
            this.adx.val = this.adx.val == null
              ? this.adx._dxt / period
              : (last.val * (period - 1) + dx) / period
            
        }
      }
    }
    return this.adx.val 
  }
  /**
   * Cálculo del valor verdadero con alisado Wilder
   * @param {int} period
   * @returns Float resultado del cálculo de ATR
   */
  ATR(period = 14) {
    if (this.data.len() < period) return null
    let tr = this.TR();
    let last = this.atr.val || null;
    this.atr.val =
      this.atr.val == null
        ? this.simpleMediaAverage("atr", this.tr.data.get(period))
        : (last * (period - 1) + tr) / period;

    return parseFloat(this.atr.val);
  }
  /**
   * Cálculo de la parabólica SAR
   * @param {Candle}
   * @returns {Float}  this.sar.reset(candle)
   */
  PSAR(){
    if (this.data.len() < 1) return null
    let candle = this.data.last();
    // Inicialización
    if (this.sar.value == null) this.sar.ini(candle);
    if (candle.low < this.sar.value && candle.high > this.sar.value) {
      this.sar.reset(candle);
    }
    this.sar.max.push(candle.high);
    this.sar.min.push(candle.low);
    let ep = null;
    

    if (this.sar.trend == 1) {
        ep = this.sar.max.max();
        let min1 = this.sar.min.last(2) || this.sar.value;
        let min2 = this.sar.min.last(3) || this.sar.value;
        this.sar.value = Math.min(min1, min2, this.sar.value);
    } else {
        ep = this.sar.min.min();
        let max1 = this.sar.max.last(2) || this.sar.value;
        let max2 = this.sar.max.last(3) || this.sar.value;
        this.sar.value = Math.max(max1, max2, this.sar.value);
    }
    if (this.sar.extremePoint != ep) {
      this.sar.af +=
        this.sar.af == 0 ? this.sar.startFactor : this.sar.acelerationFactor;
      if (this.sar.af > this.sar.maxFA) this.sar.af = this.sar.maxFA;
    }
    this.sar.value = this.sar.value + this.sar.af * (ep - this.sar.value);
    this.sar.extremePoint = ep;
    return this.sar.value || null;
  }
  /**
   * Medias Móviles
   * @param {array|integer|null} data numeros de los que extraer una media simple
   * @param {int|null} period periodo de la media
   * @returns {integer} con la media del último elemento
   */
  simpleMediaAverage(index, value, _period = null) {
    if (this.sma.data[index] == undefined) {
      this.sma.data[index] = new Data();
      this.sma.acc[index] = new Data();
    }
    let t = 0;
    let data = this.sma.data[index];
    let acc = this.sma.acc[index];
    let last = data.last();

    if (Array.isArray(value)) data = value;
    else data.push(value);

    let period = _period || data.length;
    let slice = data.slice(period * -1);
    for (let d of slice) {
      t += parseFloat(d || 0);
    }
    let r = slice.length >= period ? t / period : null;
    acc.push((r - last) / 2);
    return r;
  }
  /**
   * cálculo del rango verdadero
   * @param {Integer} period
   * @param {high, low, close} _data
   * @returns
   */
  TR() {
    let candle = this.data.last();
    let lastCandle = this.data.last(2);
    let last = this.tr.val;
    let v1, v2, v3;

    if (lastCandle != null) {
      v1 = candle.high - candle.low;
      v2 = candle.high - lastCandle.close;
      v3 = lastCandle.close - candle.low;

      this.tr.val = Math.max(v1, v2, v3);
    }

    this.tr.data.push(this.tr.val);
    return this.tr.val;
  }
  /**
   *
   * @param {*} data
   * @param {*} period
   * @param {*} softened
   * @returns
   */
  exponentialMediaAverage(index, value, period, smooth = 2) {
    if (this.ema.data[index] == undefined) {
      this.ema.data[index] = new Data();
      this.ema.acc[index] = new Data();
      this.ema.emas[index] = new Data();
    }
    let ema = null;
    let last = null;
    let data = this.ema.data[index];
    let acc = this.ema.acc[index];
    let emas = this.ema.emas[index];

    if (Array.isArray(value)) data = new Data(value);
    else data.push(value);
    if (data.len() >= period) {
      let slice = data.slice(period * -1);
      last = emas.last(1);
      if (last == null) {
        ema = this.simpleMediaAverage(index, slice);
      } else {
        let [price] = slice.slice(-1);
        let fa = smooth / (period + 1);
        //ema = (p * fa) + (last * (1-fa))
        ema = last + fa * (price - last);
      }
    }
    emas.push(ema);
    acc.push((ema - last) / 2);
    return ema;
  }
  /**
   * Es, básicamente, un oscilador de impulso que mide la magnitud de los movimientos de los precios, 
   * así como la velocidad de estos movimientos.
   * detección de condiciones sobrecompra o sobreventa en los precios.
   * una puntuación de RSI de 30 o menos sugiere que el activo está probablemente cerca de su punto más bajo 
   * una medición por encima de 70 indica que el precio del activo está seguramente cerca de su punto más alto
   * para período de cálculo considerado.
   * @param {*} period
   * @returns
   */
  RSI(period = 14) {
    if (this.data.len() < period) return null
    let len = period + 1;
    let rsi = null;

    let data = this.data.slice(len * -1);
    if (data.length >= len) {
      let last = null;
      let pos = 0;
      let neg = 0;
      // Calculo RS

      for (let d of data) {
        if (last != null) {
          if (d.price > last > 0) pos += d.price - last;
          else neg += last - d.price;
        }
        last = d.price;
      }
      let ms = pos / period;
      let mb = neg / period;
      let rs = ms / mb;
      rsi = 100 - 100 / (1 + rs) || null;
    }
    return rsi;
  }
  MACD(_data = null, short = 12, long = 26) {
    if (this.data.len() < 1) return null;
    if (this.macd == undefined)
      this.macd = { data: new Data(), acc: new Data(), sign: new Data() };
    let data =
      _data == null
        ? this.data.last().close
        : this.data.this.macd.data.push(_data);
    let ema1 = this.exponentialMediaAverage("MACD1", data, short);
    let ema2 = this.exponentialMediaAverage("MACD2", data, long);
    let last = this.macd.data.last();
    let macd = ema1 - ema2;
    let acc = macd - last;
    this.macd.data.push(macd);
    this.macd.acc.push(acc);
    let signs = this.macd.data.slice(-9).map((a, b) => a + b);
    this.macd.sign.push(signs.slice(-1)[0]);
    return macd;
  }
  /**
   * Cálculo de las bandas de bollinger
   * @param {integer} period
   * @param {integer} factor
   * @returns
   */
  bollinger(period = 20, factor = 2) {
    if (this.data.len() < period) return {}
    let avh = null,
      avl = null,
      bs = null,
      bi = null;
    let highs = this.data.slice(period * -1).map((data) => data.high);
    let lows = this.data.slice(period * -1).map((data) => data.low);
    if (highs.length >= period) {
      avh = this.simpleMediaAverage("blh", highs);
      avl = this.simpleMediaAverage("bll", lows);
      let sdh = this.standardDeviation("sdh", highs);
      let sdl = this.standardDeviation("sdl", lows);
      bs = avh + factor * sdh;
      bi = avl - factor * sdl;
    }

    return { high: bs, midleh: avh, midlel: avl, low: bi };
  }
  /**
   * Cálculo de la desviación standard
   * @param {string} index indeice de guardado
   * @param {array|float|integer} _data
   * @param {integer} period
   * @returns float
   */
  standardDeviation(index, _data, period = null) {
    if (IndicatorJS.filters.isEmpty(_data)) return null;
    let slice = [];

    this.sd.data[index] ||= new Data();

    let data = this.sd.data[index];

    if (Array.isArray(_data)) slice = _data;
    else {
      this.sd.data[index].push(_data);
      slice = data.slice(period * -1);
    }
    let len = period || slice.length;
    let sma = this.simpleMediaAverage(index, slice);
    let t = 0;
    for (let el of slice) {
      t += Math.pow(el - sma, 2);
    }
    return parseFloat(Math.sqrt(t / (len - 1)));
  }
  /**
   * Cálculo de soportes y resistencias
   */
  supportsResistences() {
    //console.log(this.data.last(2));
    //process.exit();
  }
  /**
   * Cálculos del indicador storástico
   * El indicador estocástico es un oscilador que busca determinar cuán fuerte es el impulso del mercado, 
   * comparando el precio de cierre de un valor con su rango de precios durante un período de tiempo específico.
   * 
   * Si el indicador se eleva por encima de 75, es muestra de la posible sobrecompra de activo;
   * Si el indicador cae por debajo de 25, esto muestra la posible sobreventa de activo.
   * @param {integer} period 
   * @returns 
   */
  stochastic(period = 14, smooth=3){
    if (this.data.len() < period) return null
    let data = this.data.get(period)
    let close = this.data.last().close
    let min = Math.min(...data.map(c=>c.low))
    let max = Math.max(...data.map(c=>c.high))
    let k = ((close-min)/(max-min))*100
    let d = this.simpleMediaAverage('stoc',k, smooth)
    return d
  }
  /**
   * Mide la volatilidad la rapidez con la que se mueven los precios.
   * Altos valores indican inestabilidad
   * @param {*} period 
   * @returns 
   */
  VIX(period = 10){
    this.vix.daily = null 
    this.vix.annual = null
    if(this.data.len()>2){
      let calc = this.data.last().close / this.data.last(2).close
      let r = math.log(calc)
      this.vix.data.push(r)
      if (this.vix.data.len() > period) {
        let data = this.vix.data.get(period)
        let daily = math.std(data)
        this.vix.daily = daily * 100
        this.vix.annual = daily * math.sqrt(260)
      }
    }
    return this.vix.annual * 100
  }
  static filters = {
    error: true,
    isEqual(a, b, factor = 0) {
      return a + factor == b;
    },
    isNotEqual(a, b) {
      return a != b;
    },
    isNull() {
      let r = true;
      for (let a of arguments) r = r && a == null;
      return r;
    },
    isNotNull() {
      let r = true;
      for (let a of arguments) r = r && a != null;
      return r;
    },
    isGreater(a, b, factor = 0) {
      return a + factor > b;
    },
    /**
     * Comprueba que a se encuentra en la zona de influencia de b
     * @param {float} a  valor que entra en zona
     * @param {float} b  valor de la zona
     * @param {float} percent tamaño de la zona
     * @returns {boolean}
     */
    isInZone(a, b, percent) {
      let factor = (percent * b) / 100;
      let z1 = b + factor;
      let z2 = b - factor;
      return a >= z2 && a <= z1;
    },
    isEmpty() {
      let r = true;
      for (let a of arguments)
        r = (r && a == null) || a == "NaN" || a == "undefined";
      return r;
    },
  };
}
module.exports = IndicatorJS;
