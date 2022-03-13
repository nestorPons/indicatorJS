/**
 * Tratamiento de datos para el objeto
 */
 class Data{
     constructor(){
        this.container = []
     }
    push(value){
        this.container.push(value)
    }
    add(value){
        this.container.push(value)
    }
    reset(){
        this.container = []
    }
    last(value = 1){
        return this.container[this.container.length - value]
    }
    get(){
        return this.container
    }
    len(){
        return this.container.length
    }
    slice(value){
        return this.container.slice(value)
    }
    error(){
        try{
            if(this.container < 1) throw 1
        }catch(err){
            if(err == 1)
                console.log(
                '\x1b[31m%s\x1b[0m',
                "No existen datos para analizar.\nPuede añadir velas al objeto con trade.add(new Candle())"
                )
        }
    }

}
module.exports = Data