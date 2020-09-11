import { WebClient, ChatPostMessageArguments, ViewsOpenArguments, WebAPICallOptions, TokenOverridable, WebAPICallResult } from "@slack/web-api"
import { SlackMessageAdapter } from "@slack/interactive-messages/dist/adapter"
import { SlackEventAdapter } from "@slack/events-api/dist/adapter"
import commander from "commander"
import stringArgv from 'string-argv';
import { 
    View, Option, InputBlock, Button, DividerBlock, SectionBlock, Overflow,
    Datepicker, Select, MultiSelect, Action, ImageElement, RadioButtons, Checkboxes, ViewsUpdateArguments 
} from "@slack/web-api/dist/methods"
import { EventEmitter } from "events"
import axios from "axios"

import { asEventEmitter } from "./util";

export type SlackModal = Omit<View, "type">
export interface ModalOpenArguments extends WebAPICallOptions, TokenOverridable {
    trigger_id: string;
    modal: SlackModal;
}
export interface ModalUpdateArguments extends WebAPICallOptions, TokenOverridable {
    view_id: string;
    modal: SlackModal;
    external_id?: string;
    hash?: string;
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
        .catch(error => console.error("Error opening modal\n", error))
    }

    
    public updateModal(view: View): Promise<WebAPICallResult>
    public updateModal(options: ModalUpdateArguments): Promise<WebAPICallResult>
    public updateModal(x: any){
        if (isModalOptions(x)) {
            let options: ModalUpdateArguments = x
            let view: View = {
                ...options.modal,
                type: "modal"
            }

            return this.client.views.update({
                ...options,
                view: view
            })
            .catch(error => console.error("Error updating modal\n", error))
        }

        if (isView(x)) {
            let view = x
            return this.client.views.update({
                view_id: view.id,
                view: {
                    type: view.type,
                    blocks: view.blocks,
                    callback_id: view.callback_id,
                    close: view.close,
                    submit: view.submit,
                    title: view.title,
                    clear_on_close: view.clear_on_close,
                    notify_on_close: view.notify_on_close,
                    private_metadata: view.private_metadata
                }
            })
            .catch(error => console.error("Error updating modal\n", error))
        }

        function isView(obj: any): obj is View & {id: string} {
            return (obj as View).private_metadata !== undefined
        }
        function isModalOptions(obj: any): obj is ModalUpdateArguments {
            return (obj as ModalUpdateArguments).modal !== undefined
        }
    }
    
    public async getFile(url: string) {
        let response = await axios.get(url, {
            headers: {
                "Authorization": `Bearer ${this.client.token}`
            }
        })
        return response.data
    }

    public storeOptions(actionId: string, options: Array<Option>) {
        this.optionsByActionId[actionId] = options
    }
    public getOptions(actionId: string) {
        return this.optionsByActionId[actionId]
    }
}
export class SlackBlockFactory {
    public section(options: {
        text: string,
        blockId?: string,
        accessory?: Button | Overflow | Datepicker | Select | MultiSelect | Action | ImageElement | RadioButtons | Checkboxes
    }): SectionBlock {
        return {
            type: "section",
            block_id: options.blockId,
            accessory: options.accessory,
            text: {
                text: options.text,
                type: "plain_text",
                emoji: true
            }
        }
    }
    public option(label: string, value: any): Option {
        return {
            text: {
                text: label,
                type: "plain_text",
                emoji: true
            },
            value: `${value}`
        }
    }
    public externalSelect(options: {
        blockId: string,
        label: string,
        placeholder: string,
        actionId?: string,
        multi?: boolean
    }): InputBlock {
        if (!options.actionId) {
            options.actionId = "selection"
        }
        let elementType: "multi_external_select" | "external_select" = "external_select"
        if (options.multi) {
            elementType = "multi_external_select"
        }
        
        return {
            block_id: options.blockId,
            type: "input",
            label: {
                type: "plain_text",
                text: options.label,
                emoji: true
            },
            element: {
                type: elementType,
                action_id: options.actionId,
                min_query_length: 1,
                placeholder: {
                    text: options.placeholder,
                    type: "plain_text",
                    emoji: true
                }
            }
        }
    }
    public button(options: {
        text: string,
        actionId?: string,
        value?: string,
        style?: "danger" | "primary"
    }): Button {
        return {
            type: "button",
            action_id: options.actionId,
            style: options.style,
            text: {
                type: "plain_text",
                text: options.text,
                emoji: true
            },
            value: options.value
        }
    }
    public radioButtons(options: {
        blockId: string,
        label: string,
        options: Array<Option>,
        actionId?: string
    }): InputBlock {
        if (!options.actionId) {
            options.actionId = "radioButtons"
        }

        return {
            type: "input",
            block_id: options.blockId,
            label: {
                text: options.label,
                type: "plain_text",
                emoji: true
            },
            element: {
                type: "radio_buttons",
                action_id: options.actionId,
                options: options.options
            }
        }
    }
    public divider(): DividerBlock {
        return {
            type: "divider"
        }
    }
}
export const blockFactory = new SlackBlockFactory()