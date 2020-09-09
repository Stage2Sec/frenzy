export function codeBlock(content: any) {
    if (typeof content == "object") {
        content = JSON.stringify(content, null, 3)
    }

    return `\`\`\`${content}\`\`\``
}