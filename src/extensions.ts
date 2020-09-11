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
        firstOrDefault(): T
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

Array.prototype.firstOrDefault = function () {
    if (this.length > 0) {
        return this[0]
    }
    return undefined
}

export {}