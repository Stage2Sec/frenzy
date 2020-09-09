import { EventEmitter } from "events"
import { WebClient } from "@slack/web-api"
import { SlackMessageAdapter } from "@slack/interactive-messages/dist/adapter"
import { SlackEventAdapter } from "@slack/events-api/dist/adapter"

function isEventEmitter(obj: any): obj is EventEmitter {
    return (obj as EventEmitter).on !== undefined
}

export function asEventEmitter(obj: any): EventEmitter | undefined {
    if (isEventEmitter(obj)) {
        return obj
    }

    return undefined
}


export interface Slack {
    webClient: WebClient,
    events: SlackEventsHandler,
    interactions: SlackMessageAdapter
}
export interface PluginInfo {
    name: string,
    description: string,
    version: string
}
export type Plugin = (slack: Slack) => PluginInfo | Promise<PluginInfo>

export class SlackEventsHandler {
    constructor(prefix: string, events: SlackEventAdapter){
        this.prefix = prefix

        this.slackEvents = asEventEmitter(events)
        this.on("message", this.handleMessage.bind(this))
    }

    private slackEvents?: EventEmitter
    private registeredEvents: EventEmitter = new EventEmitter()
    private prefix: string

    private on(event: string, listener: (...args: any[]) => void) {
        this.slackEvents?.on(event, listener)
    }
    private handleMessage(event: any) {
        if (event.bot_id) {
            return
        }
        
        console.log("Received message: ", event)
        event.text = event.text.trim()
        this.registeredEvents.eventNames().forEach(name => {
            if (event.text.startsWith(name)) {
                event.dotCommandPayload = event.text.replace(name, "").trim()
                this.registeredEvents.emit(name, event)
            }
        })
    }

    public dotCommand(command: string, action: (event: any) => void) {
        if (!command.startsWith(".")) {
            command = `.${command}`
        }
        this.registeredEvents.on(`.${this.prefix}${command}`, action)
    }
}