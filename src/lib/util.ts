import { EventEmitter } from "events"

function isEventEmitter(obj: any): obj is EventEmitter {
    return (obj as EventEmitter).on !== undefined
}

export function asEventEmitter(obj: any): EventEmitter | undefined {
    if (isEventEmitter(obj)) {
        return obj
    }

    return undefined
}