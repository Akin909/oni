/**
 * NeovimTokenColorSynchronizer
 *
 * This is a helper that pushes all the token colors to Neovim
 * as custom highlight groups.
 */

import * as Color from "color"

import * as Log from "oni-core-logging"

import { TokenColor } from "./../Services/TokenColors"

import { NeovimInstance } from "./NeovimInstance"

const getGuiStringFromTokenColor = ({ settings: { fontStyle } }: TokenColor): string => {
    if (!fontStyle) {
        return "gui=none"
    } else if (fontStyle.includes("bold italic")) {
        return "gui=bold,italic"
    } else if (fontStyle === "bold") {
        return "gui=bold"
    } else if (fontStyle === "italic") {
        return "gui=italic"
    } else {
        return "gui=none"
    }
}

export class NeovimTokenColorSynchronizer {
    private _currentIndex: number = 0
    private _tokenScopeSelectorToHighlightName: { [key: string]: string } = {}
    private _highlightNameToHighlightValue: { [key: string]: string } = {}

    constructor(private _neovimInstance: NeovimInstance) {}

    // This method creates highlight groups for any token colors that haven't been set yet
    public async synchronizeTokenColors(tokenColors: TokenColor[]): Promise<void> {
        const highlightsToAdd = tokenColors.map(tokenColor => {
            const highlightName = this._getOrCreateHighlightGroup(tokenColor)
            const highlightFromScope = this._convertTokenStyleToHighlightInfo(tokenColor)

            console.group("Highlight INFO")
            console.log(
                "this._tokenScopeSelectorToHighlightName: ",
                this._tokenScopeSelectorToHighlightName,
            )

            console.log(
                "this._highlightNameToHighlightValue, : ",
                this._highlightNameToHighlightValue,
            )

            const currentHighlight = this._highlightNameToHighlightValue[highlightName]
            console.log("currentHightlight: ", currentHighlight)
            console.log("highlightFromScope: ", highlightFromScope)
            console.groupEnd()

            if (currentHighlight === highlightFromScope) {
                return null
            } else {
                this._highlightNameToHighlightValue[highlightName] = highlightFromScope
                return highlightFromScope
            }
        })

        const filteredHighlights = highlightsToAdd.filter(hl => !!hl)

        const atomicCalls = filteredHighlights.map(hlCommand => {
            return ["nvim_command", [hlCommand]]
        })

        if (atomicCalls.length === 0) {
            return
        }

        Log.info(
            "[NeovimTokenColorSynchronizer::synchronizeTokenColors] Setting " +
                atomicCalls.length +
                " highlights",
        )
        await this._neovimInstance.request("nvim_call_atomic", [atomicCalls])
        Log.info(
            "[NeovimTokenColorSynchronizer::synchronizeTokenColors] Highlights set successfully",
        )
    }

    /**
     * Gets the highlight group for the particular token color. Requires that `synchronizeTokenColors` has been called
     * previously.
     */
    public getHighlightGroupForTokenColor(tokenColor: TokenColor): string {
        return this._getOrCreateHighlightGroup(tokenColor)
    }

    private _convertTokenStyleToHighlightInfo(tokenColor: TokenColor): string {
        const name = this._getOrCreateHighlightGroup(tokenColor)
        const foregroundColor = Color(tokenColor.settings.foreground).hex()
        const backgroundColor = Color(tokenColor.settings.background).hex()
        console.log("tokenColor: ", tokenColor)
        console.log("foregroundColor: ", foregroundColor)
        const gui = getGuiStringFromTokenColor(tokenColor)
        return `:hi ${name} guifg=${foregroundColor} guibg=${backgroundColor} ${gui}`
    }

    private _getOrCreateHighlightGroup(tokenColor: TokenColor): string {
        const existingGroup = this._tokenScopeSelectorToHighlightName[
            this._getKeyFromTokenColor(tokenColor)
        ]
        if (existingGroup) {
            return existingGroup
        } else {
            this._currentIndex++
            const newHighlightGroupName = "oni_highlight_" + this._currentIndex.toString()
            Log.verbose(
                "[NeovimTokenColorSynchronizer::_getOrCreateHighlightGroup] Creating new highlight group - " +
                    newHighlightGroupName,
            )
            this._tokenScopeSelectorToHighlightName[
                this._getKeyFromTokenColor(tokenColor)
            ] = newHighlightGroupName
            return newHighlightGroupName
        }
    }

    private _getKeyFromTokenColor(tokenColor: TokenColor): string {
        return `${tokenColor.scope}_${tokenColor.settings.background}_${
            tokenColor.settings.foreground
        }_${tokenColor.settings.fontStyle === "bold"}_${tokenColor.settings.fontStyle === "italic"}`
    }
}
