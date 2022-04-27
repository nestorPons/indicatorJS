/**
 * Script de obtención de datos con la api de binance
 * Se requiere de registro en la plataforma y de sus claves de la api
 */
const fs = require('fs');
const Binance = require('node-binance-api');
// Las claves deben estar guardadas en el terminal como Variables de entorono
const binance = new Binance().options({
    APIKEY: process.env.BINANCEAPIKEY, 
    APISECRET: process.env.BINANCEAPIKEYSECRET
});
// Array con los codigos de los activos que se desea obtener los datos
const symbols = ['BNBUSDT']
// Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
const timmings = ['1m']//,'3m','5m','15m','30m']
// Tipo de guardado json | csv
const extens = 'json'

// Variables internas para uso en el script
let fechafin = new Date()
let nloops=[] 
// Cuerpo del inicio
async function main() {
    try {
        // Primer bucle para requerir las temporalidades
        for(let symbol of symbols){
            for(let timming of timmings){
                // dir del archivo que se desea guardar este caso formato JSON
                let file_data = `./db/data-${symbol}-${timming}.${extens}`
                nloops[timming] =  0
                // Limpiamos el archivo si existe
                fs.writeFile(file_data, '', e => e)
                // Obtenemos los datos
                getData(symbol, timming, file_data)
            }
        }
    } catch (err) {
        console.log(err)
    }
}
/**
 * Función auxiliar para la obtención de datos
 * @param {String} symbol Codigo del activo 
 * @param {String} timming  1m|3m|5m|15m|30m|1h|2h|4h|6h|8h|12h|1d|3d|1w|1M
 * @param {String} filedata Dirección del archivo a guardar
 */
async function getData(symbol ,timming, filedata){
    // La petición AJAX a la API
    await binance.candlesticks(symbol, timming, async (error, ticks, symbol) => {      
        let jsonArray = []
        fechafin = new Date(ticks[0][0])
            
        fs.readFile(filedata, 'utf8', async (err, file) => {
            let strContent = '' 
            if(extens == 'json'){
                /**
                 * Se guarda el array de JSONs en el archivo  
                 */
                let lastdata = file != '' ? JSON.parse(file).data : []
                for (const i in ticks) {
                    const tick = ticks[i]
                    /**
                         * Se espera el siguiente Array
                         *[
                         *  1499040000000,      // Open time
                         *  "0.01634790",       // Open
                         *  "0.80000000",       // High
                         *  "0.01575800",       // Low
                         *  "0.01577100",       // Close
                         *  "148976.11427815",  // Volume
                         *  1499644799999,      // Close time
                         *  "2434.19055334",    // Quote asset volume
                         *  308,                // Number of trades
                         *  "1756.87402397",    // Taker buy base asset volume
                         *  "28.46694368",      // Taker buy quote asset volume
                         *  "17928899.62484339" // Ignore
                         *]
                         */
                    // Se obtiene el array con los datos 
                    let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;
                    let date = new Date(time);
                    // Se crea un nuevo array con objetos JSON
                    jsonArray.push({
                        "time": parseInt(time),
                        "datetime": date.toLocaleString(),
                        "open": parseFloat(open),
                        "close": parseFloat(close),
                        "high": parseFloat(high),  
                        "low": parseFloat(low),
                        "volume": parseFloat(volume),
                        "trades": parseFloat(trades),
                        "assetVolume": parseFloat(assetVolume),
                        "buyBaseVolume": parseFloat(buyBaseVolume),
                    })
                }
                strContent =  JSON.stringify({
                    "symbol": symbol,
                    "timming": timming,
                    "data": [...jsonArray,...lastdata]
                })
            } else
            if (extens == 'csv'){
                strContent += file
                for(let tick of ticks){
                    strContent += tick.toString() + '\n'   
                }
            }
            fs.writeFile(filedata, strContent, err => err)
            
        })
        // Mensaje de finalización por consola
        console.log(timming +' '+ fechafin.toLocaleString())
        /**
         * Binance solo acepta 1000 registros por petición
         * Se crea un bucle para obtener más 
         * con la configuración por defecto se obtienen 10000 registros 
         * */ 
        if (nloops[timming] < 9) (nloops[timming] +=1) 
            && await getData(symbol ,timming, filedata)
        
    }, {
        limit: 10000,
        endTime: fechafin.getTime()
    })
}
//Inicia la funcion principal
main();