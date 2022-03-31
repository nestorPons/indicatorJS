/**
 * Tratamiento de datos para el objeto
 */
 class Data{
    constructor(limit = 50){
        this.limit = limit
        this.container = []
    }
    get length(){
        return this.container.length
    }
    add(value){
        this.container.push(value)
     }
    get(slice=null){
        if(slice) return this.container.slice(slice*-1)
        return this.container
    }
    max(index=null){
        if (index != null){
            return Math.max(...this.container.map(d=>d[index]))
        }else{
            return Math.max(...this.get())
        }
    }
    min(index=null){
        if (index != null){
            return Math.min(...this.container.map(d=>d[index]))
        }else{
            return Math.min(...this.get())
        }
    }
    last(value = 1){
        return this.container[this.container.length - value] || null
    }
    len(){
        return this.container.length
    }
    slice(value){
        return this.container.slice(value)
    }
    push(value){
        if (this.container.length > this.limit) this.container.unshift()
        this.container.push(value)
    }
    reset(){
        this.container = []
    }
    test(){
        try{
            if(this.container < 1) throw 1
        }catch(err){
            if(err == 1){
                console.log(
                '\x1b[31m%s\x1b[0m',
                "No existen datos para procesar.\nSe puede añadir datos mediante el método add"
                )
                process.exit()
            }

        }
    }


}
module.exports = Data