/**
 * Hover.tsx
 */

import * as marked from "marked"
import * as Oni from "oni-api"
import * as os from "os"
import * as React from "react"
import * as types from "vscode-languageserver-types"

import { ErrorInfo } from "./../../UI/components/ErrorInfo"
import { QuickInfoDocumentation, QuickInfoTitle } from "./../../UI/components/QuickInfo"

import * as Helpers from "./../../Plugins/Api/LanguageClient/LanguageClientHelpers"

import { Colors } from "./../../Services/Colors"
import { Configuration } from "./../../Services/Configuration"

import * as Selectors from "./NeovimEditorSelectors"
import { IToolTipsProvider } from "./ToolTipsProvider"

const HoverToolTipId = "hover-tool-tip"

export class HoverRenderer {

    constructor(
        private _colors: Colors,
        private _editor: Oni.Editor,
        private _configuration: Configuration,
        private _toolTipsProvider: IToolTipsProvider,
    ) {
    }

    public showQuickInfo(x: number, y: number, hover: types.Hover, errors: types.Diagnostic[]): void {
        const elem = this._renderQuickInfoElement(hover, errors)

        if (!elem) {
            return
        }

        this._toolTipsProvider.showToolTip(HoverToolTipId, elem, {
            position: { pixelX: x, pixelY: y },
            openDirection: 1,
            padding: "0px",
        })
    }

    public hideQuickInfo(): void {
        this._toolTipsProvider.hideToolTip(HoverToolTipId)
    }

    private _renderQuickInfoElement(hover: types.Hover, errors: types.Diagnostic[]): JSX.Element {
        const quickInfoElements = getQuickInfoElementsFromHover(hover)

        const borderColor = this._colors.getColor("toolTip.border")

        let customErrorStyle = {}
        if (quickInfoElements.length > 0) {
            // TODO:
            customErrorStyle = {
                "border-bottom": "1px solid " + borderColor,
            }
        }

        const errorElements = getErrorElements(errors, customErrorStyle)

        const elements = [...errorElements, ...quickInfoElements]

        if (this._configuration.getValue("experimental.editor.textMateHighlighting.debugScopes")) {
            elements.push(this._getDebugScopesElement())
        }

        if (elements.length === 0) {
            return null
        }

        return <div className="quickinfo-container enable-mouse">
            <div className="quickinfo">
                <div className="container horizontal center">
                    <div className="container full">
                        {elements}
                    </div>
                </div>
            </div>
        </div>
    }

    private _getDebugScopesElement(): JSX.Element {
        const editor: any = this._editor

        if (!editor || !editor.syntaxHighlighter) {
            return null
        }

        const cursor = editor.activeBuffer.cursor
        const scopeInfo = editor.syntaxHighlighter.getHighlightTokenAt(editor.activeBuffer.id, {
            line: cursor.line,
            character: cursor.column,
        })

        if (!scopeInfo || !scopeInfo.scopes) {
            return null
        }
        const items = scopeInfo.scopes.map((si: string) => <li>{si}</li>)
        return <div className="documentation">
            <div>DEBUG: TextMate Scopes:</div>
            <ul>
                {items}
            </ul>
        </div>
    }
}

const getErrorElements = (errors: types.Diagnostic[], style: any): JSX.Element[] => {
    if (!errors || !errors.length) {
        return Selectors.EmptyArray
    } else {
        return [<ErrorInfo errors={errors} style={style} />]
    }
}

const convertMarkedString = (markdown: string): { __html: string } => {
    marked.setOptions({ sanitize: true, gfm: true })
    const html = marked(markdown)
    return { __html: html }
}

const getTitleAndContents = (result: types.Hover) => {
    if (!result || !result.contents) {
        return null
    }

    const contents = Helpers.getTextFromContents(result.contents)
    console.log('contents: ', contents);

    if (contents.length === 0) {
        return null
    } else if (contents.length === 1 && contents[0]) {
        const title = contents[0].trim()

        if (!title) {
            return null
        }

        return {
            title: convertMarkedString(title),
            description: null,
        }
    } else {

        const description = [...contents]
        description.shift()
        const descriptionContent = description.join(os.EOL)

        return {
            title: convertMarkedString(contents[0]),
            description: convertMarkedString(descriptionContent),
        }
    }
}

const getQuickInfoElementsFromHover = (hover: types.Hover): JSX.Element[] => {
    const titleAndContents = getTitleAndContents(hover)

    if (!titleAndContents) {
        return Selectors.EmptyArray
    }

    return [
        <QuickInfoTitle html={titleAndContents.title} />,
        <QuickInfoDocumentation html={titleAndContents.description} />,
    ]
}
