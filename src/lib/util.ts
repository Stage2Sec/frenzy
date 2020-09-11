import { EventEmitter } from "events"
import { WebClient, ChatPostMessageArguments, ViewsOpenArguments, WebAPICallOptions, TokenOverridable } from "@slack/web-api"
import { SlackMessageAdapter } from "@slack/interactive-messages/dist/adapter"
import { SlackEventAdapter } from "@slack/events-api/dist/adapter"
import commander from "commander"
import stringArgv from 'string-argv';
import { View, Option } from "@slack/web-api/dist/methods"

function isEventEmitter(obj: any): obj is EventEmitter {
    return (obj as EventEmitter).on !== undefined
}

export function asEventEmitter(obj: any): EventEmitter | undefined {
    if (isEventEmitter(obj)) {
        return obj
    }

    return undefined
}

export interface PluginInfo {
    name: string,
    description: string,
    version: string
}
export type Plugin = (slack: Slack) => PluginInfo | Promise<PluginInfo>
export type SlackModal = Omit<View, "type">
export interface ModalOpenArguments extends WebAPICallOptions, TokenOverridable {
    trigger_id: string;
    modal: SlackModal;
}
export class Slack {
    constructor(webClient: WebClient, events: SlackEventAdapter, interactions: SlackMessageAdapter){
        this.client = webClient
        this.interactions = interactions
        this.events = asEventEmitter(events)
        this.on("message", this.handleMessage.bind(this))
    }

    public client: WebClient
    public interactions: SlackMessageAdapter
    public events?: EventEmitter
    public optionsByActionId: Record<string, Array<Option>> = {}
    private registeredDotCommands: EventEmitter = new EventEmitter()

    private on(event: string, listener: (...args: any[]) => void) {
        this.events?.on(event, listener)
    }
    private handleMessage(event: any) {
        if (event.bot_id) {
            return
        }

        console.log("Received message: ", event)
        if (event.text) {
            event.text = event.text.trim()
            this.registeredDotCommands.eventNames().forEach(name => {
                if (event.text.startsWith(name)) {
                    this.registeredDotCommands.emit(name, event)
                }
            })
        }
    }

    public dotCommand(options: string | { command: string, parser?: commander.Command}, action: (event: any) => void) {
        if (typeof options == "string") {
            options = { command: options }
        }

        let command = options.command
        let parser = options.parser
        if (!command.startsWith(".")) {
            command = `.${command}`
        }

        this.registeredDotCommands.on(command, (event) => {
            if (parser) {
                parser.parse(stringArgv(event.text, undefined, command), { from: "user" })
                event.args = parser
            }
            action(event)
        })
    }

    public postError(channel: string, error: any) {
        this.client.chat.postMessage({
            channel: channel,
            text: error.toString(),
            icon_emoji: ":octagonal_sign:"
        })
    }
    public postMessage(options: ChatPostMessageArguments) {
        return this.client.chat.postMessage(options)
    }
    public openModal(options: ModalOpenArguments) {
        let view: View = {
            ...options.modal,
            type: "modal"
        }
        
        let openOptions: ViewsOpenArguments = {
            ...options,
            view: view
        }
        return this.client.views.open(openOptions)
        .catch(error => console.error("Error opening modal", error))
    }

    public addOptions(actionId: string, options: Array<Option>) {
        this.optionsByActionId[actionId] = options
    }
    public getOptions(actionId: string) {
        return this.optionsByActionId[actionId]
    }
    public createOption(label: string, value: any): Option {
        return {
            text: {
                text: label,
                type: "plain_text",
                emoji: true
            },
            value: `${value}`
        }
    }
}