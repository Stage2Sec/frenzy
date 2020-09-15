declare global {
    interface String {
        /**
         * Case insensitive version of string.startsWith() function
         */
        iStartsWith(searchString: string): boolean
        /**
         * Case insensitive string comparison
         */
        iEquals(str: string): boolean
        /**
         * Case insensitive version of string.includes() function
         */
        iIncludes(searchString: string): boolean
    }

    interface Array<T> {
        /**
         * Returns the first element of the array or undefined if the array is empty
         */
        first(): T

        /**
         * Returns the first element of the array or undefined if the array is empty
         * and casts it as the specified type
         */
        firstAs<TFirst>(): TFirst

        ofType<TFilter>(typeCheck: (obj: TFilter) => boolean): Array<TFilter>
        asType<TAs>(): Array<TAs>
    }
}

String.prototype.iStartsWith = function(searchString: string) {
    return this.toLowerCase().startsWith(searchString.toLowerCase())
}
String.prototype.iEquals = function(str: string) {
    return this.toLowerCase() === str.toLowerCase()
}
String.prototype.iIncludes = function(searchString: string) {
    return this.toLowerCase().includes(searchString.toLowerCase())
}

Array.prototype.first = function () {
    if (this.length > 0) {
        return this[0]
    }
    return undefined
}
Array.prototype.firstAs = function<TFirst>() {
    return this.first() as TFirst
}

Array.prototype.ofType = function<TFilter>(typeCheck: (obj: TFilter) => boolean) {
    let filterArray: Array<TFilter> = []
    this.filter(element => isTFilter(element)).forEach(element => {
      filterArray.push(element)  
    })
    return filterArray

    function isTFilter(obj: any): obj is TFilter {
        return typeCheck(obj as TFilter)
    }
}
Array.prototype.asType = function<TAs>() {
    return this.map(e => e as TAs)
}

export {}