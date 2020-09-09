import { EventEmitter } from "events"
import { WebClient } from "@slack/web-api"
import { SlackEventAdapter } from "@slack/events-api/dist/adapter"
import { SlackMessageAdapter } from "@slack/interactive-messages/dist/adapter"

function isEventEmitter(obj: any): obj is EventEmitter {
    return (obj as EventEmitter).on !== undefined
}

export function asEventEmitter(obj: any): EventEmitter | undefined {
    if (isEventEmitter(obj)) {
        return obj
    }

    return undefined
}

export interface AppInfo {
    express: Express.Application,
    slack: {
        webClient: WebClient,
        events: SlackEventAdapter,
        interactions: SlackMessageAdapter
    }
}
export interface PluginInfo {
    name: string,
    description: string,
    version: string
}
export type Plugin = (appInfo: AppInfo) => PluginInfo | Promise<PluginInfo>