import "./lib/aliases"
import "cross-fetch/polyfill"
import express from "express";
import { WebClient } from "@slack/web-api"
import { createEventAdapter } from "@slack/events-api"
import { createMessageAdapter } from "@slack/interactive-messages"
import { promises as fs } from "fs"

import { asEventEmitter, PluginInfo, Plugin, Slack, SlackEventsHandler } from "@frenzy/util";
import { join } from "path";

const port = process.env.PORT || 3000
const slackToken = process.env.SLACK_TOKEN || "";
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET || "";

const slackClient = new WebClient(slackToken);
const slackInteractions = createMessageAdapter(slackSigningSecret);
const slackEvents = createEventAdapter(slackSigningSecret);

const app = express()
app.use('/slack/actions', slackInteractions.requestListener());
app.use('/slack/events', slackEvents.requestListener());

// There is an issue with the typings for the SlackEventAdapter
// where it thinks that the class doesn't inherit from the EventEmitter class
asEventEmitter(slackEvents)?.on("error", (error) => {
    console.log(error)
})

const pluginsLoaded: Array<PluginInfo> = []
async function loadPlugins(){
    let pluginsDir = join(__dirname, "./plugins")
    let dirs = await fs.readdir(pluginsDir)
    for (const name of dirs) {
        if (!(await fs.stat(join(pluginsDir, name))).isDirectory()){
            continue
        }

        let plugin: Plugin = require(`@plugins/${name}/`).default

        let slack: Slack = {
            webClient: slackClient,
            events: new SlackEventsHandler(name, slackEvents),
            interactions: slackInteractions
        }
        let info = plugin(slack)
        if (info instanceof Promise) {
            info = await info
        }
        pluginsLoaded.push(info)
    }
}
loadPlugins()

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})