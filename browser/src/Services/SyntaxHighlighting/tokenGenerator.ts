import * as path from "path"
import * as types from "vscode-languageserver-types"
import { StackElement } from "vscode-textmate"

import { editorManager } from "../../Services/EditorManager"
import { GrammarLoader } from "../../Services/SyntaxHighlighting/GrammarLoader"
import { configuration } from "../Configuration"
import { HighlightGroupId } from "./Definitions"
import { ISyntaxHighlightTokenInfo } from "./SyntaxHighlightingStore"

interface IGetTokens {
    line: string
    prevState: StackElement
    language: string
    ext?: string
}

export default async function getTokens({ language, ext, line, prevState }: IGetTokens) {
    const Grammar = new GrammarLoader()
    const { activeBuffer: b } = editorManager.activeEditor
    const lang = language || b.language
    const extension = ext || path.extname(b.filePath)
    let tokens = null
    let ruleStack = null

    const grammar = await Grammar.getGrammarForLanguage(lang, extension)

    if (grammar) {
        const tokenizeResult = grammar.tokenizeLine(line, prevState)
        tokens = tokenizeResult.tokens.map((t: any) => ({
            range: types.Range.create(0, t.startIndex, 0, t.endIndex),
            scopes: t.scopes,
        }))
        ruleStack = tokenizeResult.ruleStack
    }
    return { ruleStack, tokens }
}

export async function getColorForToken(tokens: ISyntaxHighlightTokenInfo[]) {
    const colorMap = await mapTokensToHighlights(tokens)
    return colorMap
}

export function mapTokensToHighlights(tokens: ISyntaxHighlightTokenInfo[]): any[] {
    const mapTokenToHighlight = (token: ISyntaxHighlightTokenInfo) => ({
        highlightGroup: getHighlightGroupFromScope(token.scopes),
        range: token.range,
    })

    const highlights = tokens.map(mapTokenToHighlight).filter(t => !!t.highlightGroup)
    return highlights
}

export function getHighlightGroupFromScope(scopes: string[]): HighlightGroupId {
    const configurationColors = configuration.getValue("editor.tokenColors")
    const tokenNames = Object.keys(configurationColors)

    for (const scope of scopes) {
        const match = tokenNames.find(c => scope.indexOf(c) === 0)

        const matchingRule = configurationColors[match]

        if (matchingRule) {
            // TODO: Convert to highlight group id
            return matchingRule.settings.fallback
        }
    }

    return null
}