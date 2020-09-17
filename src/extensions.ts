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
        firstAs<S>(): S

        findAs<S extends T>(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): S

        ofType<S>(typeCheck: (obj: S) => boolean): Array<S>
        asType<S>(): Array<S>

        /**
         * Creates a readonly array of numbers starting at the specified number
         * @param size The size of the resulting array
         * @param startAt The number at which to start
         */
        range(size: number, startAt: number): ReadonlyArray<number>
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
Array.prototype.firstAs = function<S>() {
    return this.first() as S
}

Array.prototype.ofType = function<S>(typeCheck: (obj: S) => boolean) {
    let filterArray: Array<S> = []
    this.filter(element => isType(element)).forEach(element => {
      filterArray.push(element)  
    })
    return filterArray

    function isType(obj: any): obj is S {
        return typeCheck(obj as S)
    }
}
Array.prototype.asType = function<S>() {
    return this.map(e => e as S)
}

Array.prototype.findAs = function<S>(predicate: (value: any, index: number, obj: any[]) => unknown, thisArg?: any) : S {
    return this.find(predicate) as S
}

Array.prototype.range = function range(size: number, startAt: number = 0): ReadonlyArray<number> {
    return [...Array(size).keys()].map(i => i + startAt);
}

export {}