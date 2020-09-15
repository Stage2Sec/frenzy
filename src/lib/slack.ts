import { WebClient, ChatPostMessageArguments, ViewsOpenArguments, WebAPICallOptions, TokenOverridable, WebAPICallResult } from "@slack/web-api"
import { SlackMessageAdapter } from "@slack/interactive-messages/dist/adapter"
import { SlackEventAdapter } from "@slack/events-api/dist/adapter"
import commander from "commander"
import stringArgv from 'string-argv';
import { 
    View, Option, InputBlock, Button, DividerBlock, SectionBlock, Overflow,
    Datepicker, Select, MultiSelect, Action, ImageElement, RadioButtons, Checkboxes, ActionsBlock, PlainTextElement, MrkdwnElement, HeaderBlock, StaticSelect, PlainTextInput, ExternalSelect, MultiExternalSelect, MultiStaticSelect 
} from "@slack/web-api/dist/methods"
import { EventEmitter } from "events"
import axios from "axios"

import { asEventEmitter } from "./util";

export type SlackModal = Omit<View, "type">
export interface ModalOpenArguments extends WebAPICallOptions, TokenOverridable {
    trigger_id: string;
    modal: SlackModal;
}export interface ModalUpdateArguments extends WebAPICallOptions, TokenOverridable {
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
    public async openModal(options: ModalOpenArguments) {
        let view: View = {
            ...options.modal,
            type: "modal"
        }
        
        let openOptions: ViewsOpenArguments = {
            ...options,
            view: view
        }
        
        try {
            return await this.client.views.open(openOptions)
        } catch (error) {
            console.error("Error opening modal\n", error)
        }
    }

    public updateModal(view: View): Promise<WebAPICallResult>
    public updateModal(view: View, update: (view: View, metadata: any) => void | Promise<void>): Promise<WebAPICallResult>
    public updateModal(options: ModalUpdateArguments): Promise<WebAPICallResult>
    public async updateModal(x: any){
        try {
            if (isModalOptions(x)) {
                let options: ModalUpdateArguments = x
                let view: View = {
                    ...options.modal,
                    type: "modal"
                }
    
                return await this.client.views.update({
                    ...options,
                    view: view
                })
            }
    
            if (isView(x)) {
                let view = x
                if (arguments.length > 1) {
                    let update: (view: View, metadata: any) => void | Promise<void> = arguments[1]
                    await this.updateMetadata(view, metadata => update(view, metadata))
                }
    
                return await this.client.views.update({
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
            }
        } catch (error) {
            console.error("Error updating modal\n", error)
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

    public async updateMetadata(view: View, action: (metadata: any) => void | Promise<void>) {
        let metadata = this.getMetadata(view)
        let result = action(metadata)
        if (result instanceof Promise) {
            await result
        }
        view.private_metadata = JSON.stringify(metadata)
    }
    public getMetadata(view: View) {
        return view.private_metadata ? JSON.parse(view.private_metadata) : {}
    }
}

export class SlackBlockFactory {
    public section(options: {
        text: string,
        blockId?: string,
        fields?: (PlainTextElement | MrkdwnElement)[],
        accessory?: Button | Overflow | Datepicker | Select | MultiSelect | Action | ImageElement | RadioButtons | Checkboxes,
        markdown?: false
    }): SectionBlock {
        return {
            type: "section",
            block_id: options.blockId,
            accessory: options.accessory,
            fields: options.fields,
            text: options.markdown ? this.markdown(options.text) : this.plainText(options.text)
        }
    }
    public plainText(text: string): PlainTextElement{
        return {
            type: "plain_text",
            text: text,
            emoji: true
        }
    }
    public markdown(text: string): MrkdwnElement {
        return {
            type: "mrkdwn",
            text: text
        }
    }
    public option(label: string, value: any): Option {
        return {
            text: this.plainText(label),
            value: `${value}`
        }
    }
    public input(options: {
        blockId: string,
        label: string,
        optional?: boolean,
        element: Select | MultiSelect | Datepicker | PlainTextInput | RadioButtons | Checkboxes
    }): InputBlock {
        return {
            type: "input",
            block_id: options.blockId,
            element: options.element,
            label: this.plainText(options.label),
            optional: options.optional
        }
    }
    public externalSelect(options: {
        placeholder?: string,
        actionId?: string,
        multi?: boolean,
        minLength?: number
    }): ExternalSelect | MultiExternalSelect {
        if (!options.actionId) {
            options.actionId = "selection"
        }
        
        let placeholder
        if (options.placeholder) {
            placeholder = this.plainText(options.placeholder)
        }
        if (options.multi) {
            return {
                type: "multi_external_select",
                action_id: options.actionId,
                min_query_length: options.minLength,
                placeholder: placeholder
            }
        }

        return {
            type: "external_select",
            action_id: options.actionId,
            placeholder: placeholder,
            min_query_length: options.minLength
        }
    }
    public staticSelect(options: {
        actionId?: string,
        placeholder?: string,
        options: Array<Option>,
        initialOption?: Option,
        multi?: boolean
    }): StaticSelect | MultiStaticSelect {
        if (options.multi) {
            return {
                type: "multi_static_select",
                action_id: options.actionId,
                options: options.options,
                initial_options: options.initialOption ? [options.initialOption] : undefined,
                placeholder: options.placeholder ? this.plainText(options.placeholder) : undefined
            }
        }

        return {
            type: "static_select",
            action_id: options.actionId,
            options: options.options,
            initial_option: options.initialOption,
            placeholder: options.placeholder ? this.plainText(options.placeholder) : undefined
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
            text: this.plainText(options.text),
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
            label: this.plainText(options.label),
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
    public header(options: {
        text: string,
        blockId?: string
    }): HeaderBlock {
        return {
            type: "header",
            block_id: options.blockId,
            text: this.plainText(options.text)
        }
    }
    public actions(options: {
        blockId: string,
        elements: (Button | Overflow | Datepicker | Select | RadioButtons | Checkboxes | Action)[];
    }): ActionsBlock {
        return {
            type: "actions",
            block_id: options.blockId,
            elements: options.elements
        }
    }
}
export const blockFactory = new SlackBlockFactory()