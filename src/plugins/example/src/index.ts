import { Slack, Plugin, blockFactory } from "@sm4rtshr1mp/frenzy-sdk"

let slack: Slack

function setupSlack() {
    slack.dotCommand("example", async (event) => {
        let threadTs = event.thread_ts || event.ts

        // Send menu
        await slack.postMessage({
            channel: event.channel,
            thread_ts: threadTs,
            text: "Menu",
            blocks: [
                blockFactory.actions({
                    blockId: "exampleMenu",
                    elements: [
                        blockFactory.button({
                            text: "Click Me",
                            actionId: "exampleClickMe",
                            style: "primary"
                        })
                    ]
                })
            ]
        })
    })

    slack.interactions.action({
        actionId: "exampleClickMe"
    }, async (payload, respond) => {
        await slack.postMessage({
            thread_ts: payload.message.thread_ts,
            channel: payload.channel.id,
            text: `<@${payload.user.id}> clicked the 'Click Me' button`,
            mrkdwn: true
        })
    })
}

// This function can be sync or async
const plugin: Plugin = async (s) => {
    slack = s

    setupSlack()

    return {
        name: "example",
        description: "This is an example plugin for the Frenzy slack bot",
        version: "1.0.0"
    }
}
export default plugin