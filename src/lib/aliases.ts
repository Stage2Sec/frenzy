import moduleAlias from "module-alias"
import { join, dirname } from "path"
import { parse } from "comment-json"
import { readFileSync, readdirSync, statSync } from "fs"

function registerAliases(configPath: string) {
    let fullConfigPath = join(__dirname, configPath)
    let config = parse(readFileSync(fullConfigPath).toString())

    let options = config.compilerOptions
    if (!options.paths) {
        return
    }

    let baseUrl = dirname(fullConfigPath)
    if (options.baseUrl) {
        baseUrl = join(baseUrl, options.baseUrl)
    }
    
    Object.keys(options.paths).forEach(alias => {
        let path = dirname(options.paths[alias][0])
        let fullPath = join(baseUrl, path)
        alias = dirname(alias)
        moduleAlias.addAlias(alias, fullPath)
    })
}

registerAliases("../../tsconfig.json")

let pluginsDir = "../plugins"
let dirs = readdirSync(join(__dirname, pluginsDir))
for (const dir of dirs) {
    if (!statSync(join(__dirname, pluginsDir, dir)).isDirectory()){
        continue
    }

    registerAliases(`../plugins/${dir}/tsconfig.json`)
}

export {}