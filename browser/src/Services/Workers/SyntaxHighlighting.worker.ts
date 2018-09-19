/**
 * SyntaxHighlighting Web Worker
 *
 * Periodic (asynchronous) job to process syntax highlights
 */

import { IGrammar, StackElement } from "vscode-textmate"
import { Range } from "vscode-languageserver-types"

import * as Log from "oni-core-logging"
import { GrammarLoader } from "./../SyntaxHighlighting/GrammarLoader"
import * as SyntaxHighlighting from "./../SyntaxHighlighting/SyntaxHighlightingStore"

const WorkerContext: Worker = self as any
global.process = process

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

interface IExecuteArgs {
    bufferId: string
    bottomLine: number
    topLine: number
    currentState: SyntaxHighlighting.ISyntaxHighlightState
    language: string
    extension: string
    currentWindow: {
        top: number
        bottom: number
    }
}

const SYNTAX_JOB_BUDGET = 10 // Budget in milliseconds - time to allow the job to run for
const grammarLoader = new GrammarLoader()

export async function execute({
    currentWindow,
    currentState,
    topLine,
    bottomLine,
    bufferId,
    language,
    extension,
}: IExecuteArgs) {
    const start = new Date().getTime()

    if (currentWindow.top !== topLine || currentWindow.bottom !== bottomLine) {
        Log.verbose(
            "[SyntaxHighlightingPeriodicJob.execute] Completing without doing work, as window size has changed.",
        )
        return true
    }

    while (true) {
        const current = new Date().getTime()

        if (current - start > SYNTAX_JOB_BUDGET) {
            Log.verbose("[SyntaxHighlightingPeriodicJob.execute] Pending due to exceeding budget.")
            return false
        }

        const bufferState = currentState.bufferToHighlights[bufferId]

        if (!bufferState) {
            return true
        }

        const grammar = await grammarLoader.getGrammarForLanguage(language, extension)

        const anyDirty = tokenizeFirstDirtyLine({
            state: bufferState,
            topLine,
            bottomLine,
            grammar,
        })

        if (!anyDirty) {
            return true
        }
    }
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
    console.log("data: ", data)
    execute(data)
})

export default null as any
