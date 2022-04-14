# IndicatorJS

Clase con indicadores para el trading automatizado utilizando NodeJS 

Clone el repositorio 
```
git clone https://github.com/nestorPons/indicatorJS.git
cd indicatorJS
```

Requerimiento e instanciado de clase
```
const IndicatorJS = require('path.../libs/IndicatorJS.js)
let indicator = new IndicatorJS()
```

Cargar los datos mediante la clase Candle
```
const Candle = require("pa../libs/Candle.js")
const candle = new Candle({ 
    [date:   String]
    [open:   Float], 
    [high:   Float], 
    [low:    Float], 
    [close:  Float], 
    [volume: Float], 
    [quoteVolume: Float],
    [takerBuyBaseVolume: Float], 
    [takerBuyQuoteVolume: Float]
    [trades: Integet]
}
indicator.add([Candle|Array(Candle)])
```

Indicadores: 
- ADX -> Indicador de la fuerza de una tendencia potencial
    ```
    let adx = indicator.ADX([period=14])
    ```
- ATR -> Cálculo del valor verdadero con alisado Wilder
    ```
    let atr = indicator.ATR([period=14])
    ```
- PSAR -> Cálculo de la parabólica SAR
    ```
    let psar = indicator.ATR([period=14])
    ```
- SMA -> Media simple 
    ```
    let sma = indicator.SMA(index, value|Array(values), [period|null])
    ```
    index: Nombre de la media 
    value: Valor para el cálculo

- TR -> Rango verdadero
    ```
    let tr = indicator.TR()
    ```
- EMA -> Media exponencial
    ```
    let ema = indicator.EMA(index, Integer|Float|Array(values), period, [smooth=2] )
    ```
- RSI -> Oscilador
    ```
    let rsi = indicator.RSI([period])
    ```
- MACD -> Indicador de tendencia
    ```
    let macd = indicator.MACD([value],[short=12],[long=26])
    ```
- Bollinger -> Oscilador de bandas bollinger
    ```
    let boll = indicator.bollinger([period=12],[factor=2])
    ```
- Stochastic -> Oscilador
    ```
    let sto = indicator.stochastic([period=14],[smooth=3])
    ```
- VIX -> Indice de volatilidad
    ```
    let vix = indicator.VIX([period=10])
    ```