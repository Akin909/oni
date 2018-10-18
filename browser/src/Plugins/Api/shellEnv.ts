/**
 *  Essentially a fork of Sindresorhus "shell-env" package
 *
 */

import * as execa from "execa"
import stripAnsi from "strip-ansi"
import defaultShell from "default-shell"

const args = [
    "-tilc",
    'echo -n "_SHELL_ENV_DELIMITER_"; env; echo -n "_SHELL_ENV_DELIMITER_"; exit',
]

function parseEnv(env: string) {
    env = env.split("_SHELL_ENV_DELIMITER_")[1]
    const ret = {}

    for (const line of stripAnsi(env)
        .split("\n")
        .filter((line: string) => Boolean(line))) {
        const parts = line.split("=")
        ret[parts.shift()] = parts.join("=")
    }

    return ret
}

export default async (shell?: string) => {
    if (process.platform === "win32") {
        return Promise.resolve(process.env)
    }

    try {
        const result = await execa(shell || defaultShell, args)
        return parseEnv(result.stdout)
    } catch (error) {
        if (shell) {
            throw error
        } else {
            return process.env
        }
    }
}

export const sync = (shell?: string) => {
    if (process.platform === "win32") {
        return process.env
    }

    try {
        const { stdout } = execa.sync(shell || defaultShell, args)
        console.log("stdout: ", stdout)
        return parseEnv(stdout)
    } catch (error) {
        if (shell) {
            throw error
        } else {
            return process.env
        }
    }
}
