/**
 * SyntaxHighlightingPeridiocJob.ts
 *
 * Periodic (asynchronous) job to process syntax highlights
 */

import * as SyntaxHighlighting from "./../SyntaxHighlighting/SyntaxHighlightingStore"
import { IGrammar, StackElement } from "vscode-textmate"
import { Range } from "vscode-languageserver-types"

const WorkerContext: Worker = self as any

interface ITokenizeDirtyLine {
    state: SyntaxHighlighting.IBufferSyntaxHighlightState
    topLine: number
    bottomLine: number
    grammar: IGrammar
}

interface IUpdate {
    type: string
    bufferId: string
    lineNumber: number
    tokens: Array<{
        scopes: string[]
    }>
    ruleStack: StackElement
    version: number
}

function tokenizeFirstDirtyLine({
    state,
    topLine,
    bottomLine,
    grammar,
}: ITokenizeDirtyLine): IUpdate | void {
    let index = topLine

    while (index <= bottomLine) {
        const line = state.lines[index]

        if (!line) {
            break
        }

        if (!line.dirty) {
            index++
            continue
        }

        const previousStack = index === 0 ? null : state.lines[index - 1].ruleStack
        const tokenizeResult = grammar.tokenizeLine(line.line, previousStack)

        const tokens = tokenizeResult.tokens.map(token => ({
            range: Range.create(index, token.startIndex, index, token.endIndex),
            scopes: token.scopes,
        }))

        const ruleStack = tokenizeResult.ruleStack

        WorkerContext.postMessage({
            type: "SYNTAX_UPDATE_TOKENS_FOR_LINE",
            bufferId: state.bufferId,
            lineNumber: index,
            tokens,
            ruleStack,
            version: state.version,
        })
    }
}

WorkerContext.addEventListener("message", ({ data }) => {
    tokenizeFirstDirtyLine(data)
})

export default null as any
