import moduleAlias from "module-alias"
import { join, dirname, isAbsolute } from "path"
import { parse } from "comment-json"
import { readFileSync, readdirSync, statSync } from "fs"

function registerAliases(configPath: string) {
    if (!isAbsolute(configPath)) {
        configPath = join(__dirname, configPath)
    }
    let absolutePath = configPath
    let config = parse(readFileSync(absolutePath).toString())

    let options = config.compilerOptions
    if (!options.paths) {
        return
    }

    let baseUrl = dirname(absolutePath)
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

registerAliases("../tsconfig.json")

// let pluginsDir = join(__dirname, "plugins")
// for (const dir of readdirSync(pluginsDir)) {
//     let path = join(pluginsDir, dir)
//     if (!statSync(path).isDirectory()){
//         continue
//     }

//     registerAliases(join(path, "tsconfig.json"))
// }

export {}