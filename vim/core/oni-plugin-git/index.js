const fs = require("fs")
const path = require("path")
const { promisify } = require("util")
const fsStat = promisify(fs.stat)

const activate = Oni => {
    const React = Oni.dependencies.React
    let isLoaded = false
    try {
        const updateBranchIndicator = async evt => {
            if (!evt) {
                return
            }

            const gitId = "oni.status.git"
            const filePath = evt.filePath || evt.bufferFullPath
            const gitBranchIndicator = Oni.statusBar.createItem(1, gitId)

            isLoaded = true
            let dir

            try {
                let branchName, summary
                const ws = Oni.workspace.activeWorkspace
                try {
                    branchName = await Oni.services.git.getBranch(ws)
                    summary = await Oni.services.git.getVCSStatus(ws)

                    console.log("summary: ", summary)
                } catch (e) {
                    console.warn("[Oni.Git.Plugin]: ", e)
                    gitBranchIndicator.hide()
                    return
                }

                const props = {
                    style: {
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                    },
                }

                const branchContainerProps = {
                    style: {
                        minWidth: "10px",
                        textAlign: "center",
                        padding: "2px 4px 0 0",
                    },
                }

                const branchIcon = Oni.ui.createIcon({
                    name: "code-fork",
                    size: Oni.ui.iconSize.Default,
                })

                let components = []
                if (summary && (summary.insertions || summary.deletions)) {
                    const { insertions, deletions, files } = summary
                    const { activeBuffer: { filePath } } = Oni.editors.activeEditor

                    const perFile = files.reduce((acc, modified) => {
                        if (filePath.includes(modified.file)) {
                            acc.insertions = modified.insertions
                            acc.deletions = modified.deletions
                        }
                        return acc
                    }, {})

                    const iconStyles = { style: { fontSize: "0.7rem", paddingRight: "0.15rem" } }

                    let minusIcon = null
                    let minusContainer = null
                    let plusIcon = null
                    let plusContainer = null
                    let insertionSpan = null
                    let deletionSpan = null

                    if (insertions) {
                        plusIcon = Oni.ui.createIcon({ name: "plus" })
                        plusContainer = React.createElement("span", iconStyles, plusIcon)

                        insertionSpan = React.createElement("span", null, [
                            plusContainer,
                            `${insertions || ``}`,
                        ])
                    }
                    if (deletions) {
                        minusIcon = Oni.ui.createIcon({ name: "minus" })
                        minusContainer = React.createElement("span", iconStyles, minusIcon)

                        deletionSpan = React.createElement("span", null, [
                            minusContainer,
                            `${deletions || ``}`,
                        ])
                    }

                    let spacer = null

                    if (deletions && insertions) {
                        spacer = React.createElement("span", null, ", ")
                    }

                    components = [...components, insertionSpan, spacer, deletionSpan]
                }

                const branchContainer = React.createElement(
                    "span",
                    branchContainerProps,
                    branchIcon,
                )

                const branchNameContainer = React.createElement("div", { width: "100%" }, [
                    `${branchName} `,
                    ...components,
                ])

                const gitBranch = React.createElement(
                    "div",
                    props,
                    branchContainer,
                    branchNameContainer,
                )

                gitBranchIndicator.setContents(gitBranch)
                gitBranchIndicator.show()
            } catch (e) {
                console.log("[Oni.plugin.git]: ", e)
                return gitBranchIndicator.hide()
            }
        }

        if (!isLoaded) {
            updateBranchIndicator(Oni.editors.activeEditor.activeBuffer)
        }

        Oni.editors.activeEditor.onBufferEnter.subscribe(
            async evt => await updateBranchIndicator(evt),
        )

        Oni.editors.activeEditor.onBufferSaved.subscribe(
            async evt => await updateBranchIndicator(evt),
        )

        Oni.workspace.onFocusGained.subscribe(async buffer => await updateBranchIndicator(buffer))
    } catch (e) {
        console.warn("[Oni.plugin.git] ERROR", e)
    }
}

module.exports = {
    activate,
}
