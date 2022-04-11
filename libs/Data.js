/**
 * Tratamiento de datos para el objeto
 */
 class Data{
    constructor(arg){
        if(Array.isArray(arg)) {
            this.container = arg
        } else {
            this.limit = arg || 50
            this.container = []
        }
    }
    get length(){
        return this.container.length
    }
    add(value){
        this.container.push(value)
     }
    get(slice=null){
        
        return (slice) 
            ? this.container.slice(Math.abs(slice)*-1)
            : this.container
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
        return   this.container[this.container.length - value] || null
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
}
module.exports = Data