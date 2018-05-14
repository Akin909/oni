const path = require("path")
const prettier = require("prettier")

// Helper functions
const compose = (...fns) => argument => fns.reduceRight((arg, fn) => fn(arg), argument)
const joinOrSplit = (method, by = "\n") => array => array[method](by)
const join = joinOrSplit("join")
const split = joinOrSplit("split")
const isEqual = toCompare => initialItem => initialItem === toCompare
const isTrue = (...args) => args.every(a => Boolean(a))
const eitherOr = (...args) => args.find(a => !!a)
const flatten = multidimensional => [].concat(...multidimensional)

const isCompatible = (allowedFiletypes, defaultFiletypes) => filePath => {
    const filetypes = isTrue(allowedFiletypes, Array.isArray(allowedFiletypes))
        ? allowedFiletypes
        : defaultFiletypes
    const extension = path.extname(filePath)
    return filetypes.includes(extension)
}

const getSupportedLanguages = async () => {
    const info = await prettier.getSupportInfo()
    return flatten(info.languages.map(lang => lang.extensions))
}

const activate = async Oni => {
    // Tracks toggled on and off state - FIXME: find a non-mutative way to do this
    let toggledOn = true

    const config = Oni.configuration.getValue("oni.plugins.prettier")
    const prettierItem = Oni.statusBar.createItem(0, "oni.plugins.prettier")

    const applyPrettierWithState = applyPrettier()
    const defaultFiletypes = await getSupportedLanguages()

    const callback = async () => {
        const isNormalMode = Oni.editors.activeEditor.mode === "normal"
        if (isNormalMode && toggledOn) {
            await applyPrettierWithState(Oni)
        }
    }

    Oni.commands.registerCommand({
        command: "autoformat.prettier",
        name: "Autoformat with Prettier",
        execute: callback,
    })

    const checkPrettierrc = async bufferPath => {
        if (!bufferPath) {
            throw new Error(`No buffer path passed for prettier to check for a Prettierrc`)
        }
        try {
            return await prettier.resolveConfig(bufferPath)
        } catch (e) {
            throw new Error(`Error parsing config file, ${e}`)
        }
    }

    // Status Bar Component ----
    const { errorElement, successElement, prettierElement, offElement } = createPrettierComponent(
        Oni,
        callback,
    )

    if (toggledOn) {
        prettierItem.setContents(prettierElement)
    } else {
        setPrettierStatus(offElement)
    }

    const setStatusBarContents = (statusBarItem, defaultElement) => async (
        statusElement,
        timeOut = 3500,
    ) => {
        statusBarItem.setContents(statusElement)
        await setTimeout(() => statusBarItem.setContents(defaultElement), timeOut)
    }

    const setPrettierStatus = setStatusBarContents(prettierItem, prettierElement)

    Oni.commands.registerCommand({
        command: "toggle.prettier",
        name: "Toggle the prettier plugin",
        detail: "Toggle the prettier plugin on and off",
        execute: () => {
            toggledOn = !toggledOn
            if (toggledOn) {
                setPrettierStatus(prettierElement)
            } else {
                setPrettierStatus(offElement)
            }
        },
    })

    function applyPrettier() {
        // Track the buffer state within the function using a closure
        // if the buffer as a string is the same as the last state
        // do no format because nothing has changed
        let lastBufferState = null

        // pass in Oni explicitly - Make dependencies clearer
        return async (Oni, toggledOn = true) => {
            const { activeBuffer } = Oni.editors.activeEditor

            if (!toggledOn) {
                return
            }

            const [arrayOfLines, { line, character }] = await Promise.all([
                activeBuffer.getLines(),
                activeBuffer.getCursorPosition(),
            ])

            const hasNotChanged = compose(isEqual(lastBufferState), join)

            if (hasNotChanged(arrayOfLines)) {
                return
            }

            try {
                const prettierrc = await checkPrettierrc(activeBuffer.filePath)
                const prettierConfig = eitherOr(prettierrc, config.settings)

                // Pass in the file path so prettier can infer the correct parser to use
                const { formatted, cursorOffset } = prettier.formatWithCursor(
                    join(arrayOfLines),
                    Object.assign({ filepath: activeBuffer.filePath }, prettierConfig, {
                        cursorOffset: activeBuffer.cursorOffset,
                    }),
                )
                if (!formatted) {
                    throw new Error("Couldn't format the buffer")
                }

                await setPrettierStatus(successElement)

                const withoutFinalCR = formatted.replace(/\n$/, "")
                lastBufferState = withoutFinalCR

                const [, { character, line }] = await Promise.all([
                    activeBuffer.setLines(0, arrayOfLines.length, split(withoutFinalCR)),
                    activeBuffer.convertOffsetToLineColumn(cursorOffset),
                ])

                await activeBuffer.setCursorPosition(line, character)
                await Oni.editors.activeEditor.neovim.command("w")
            } catch (e) {
                console.warn(`Couldn't format the buffer because: ${e}`)
                await setPrettierStatus(errorElement)
            }
        }
    }

    const { allowedFiletypes, formatOnSave, enabled } = config
    const checkCompatibility = isCompatible(allowedFiletypes, defaultFiletypes)

    Oni.editors.activeEditor.onBufferEnter.subscribe(({ filePath }) => {
        const hasCompatibility = checkCompatibility(filePath)

        hasCompatibility ? prettierItem.show() : prettierItem.hide()
    })

    Oni.editors.activeEditor.onBufferSaved.subscribe(async ({ filePath }) => {
        const hasCompatibility = checkCompatibility(filePath)

        const canApplyPrettier = isTrue(formatOnSave, enabled, hasCompatibility, toggledOn)
        if (canApplyPrettier) {
            await applyPrettierWithState(Oni, toggledOn)
        }
    })
    return { applyPrettier: applyPrettierWithState, checkCompatibility, checkPrettierrc }
}

function createPrettierComponent(Oni, onClick) {
    const { React } = Oni.dependencies

    const background = Oni.colors.getColor("highlight.mode.normal.background")
    const foreground = Oni.colors.getColor("highlight.mode.normal.foreground")
    const style = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: "8px",
        paddingRight: "8px",
        color: "white",
        backgroundColor: foreground,
    }

    const prettierIcon = (type = "magic") =>
        Oni.ui.createIcon({
            name: type,
            size: Oni.ui.iconSize.Default,
        })

    const iconContainer = (type, color = "white") =>
        React.createElement("div", { style: { padding: "0 6px 0 0", color } }, prettierIcon(type))

    const prettierElement = React.createElement(
        "div",
        { className: "prettier", style, onClick },
        iconContainer(),
        "prettier",
    )

    const errorElement = React.createElement(
        "div",
        { style, className: "prettier" },
        iconContainer("exclamation-triangle", "yellow"),
        "prettier",
    )

    const successElement = React.createElement(
        "div",
        { style, className: "prettier" },
        iconContainer("check", "#5AB379"),
        "prettier",
    )

    const offElement = React.createElement(
        "div",
        { style, className: "prettier" },
        iconContainer("toggle-off", ""),
        "prettier",
    )

    return {
        errorElement,
        prettierElement,
        successElement,
        offElement,
    }
}

module.exports = { activate }
