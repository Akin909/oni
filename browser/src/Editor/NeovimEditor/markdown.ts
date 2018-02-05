import { unescape } from "lodash"
import * as marked from "marked"
import * as types from "vscode-languageserver-types"

const renderer = new marked.Renderer()

interface ITokens {
    scopes: any
    range: types.Range
}

interface IColors {
    highlightGroup: string
    range: types.Range
}

interface IRendererArgs {
    tokens?: ITokens[]
    colors?: IColors[]
    text: string
    element?: string
    spaces?: boolean
    container?: string
}

// const scopesToString = (scope: object) =>
//     Object.values(scope)
//         .map(s => s.replace(/\./g, "_"))
//         .join(" ")

const createContainer = (type: string, content: string) => {
    switch (type) {
        case "code":
            // <pre class="marked-pre">
            //  </pre>
            return `
                    <code>
                        ${content}
                    <code>
            `
        case "paragraph":
        default:
            return `<${type}>${content}<${type}>`
    }
}

const renderWithClasses = ({
    tokens,
    colors,
    text,
    element = "span",
    container = "paragraph",
}: IRendererArgs) => {
    // This is critical because marked's renderer refuses to leave html untouched so it converts
    // special chars to html entities which are rendered correctly in react
    const unescapedText = unescape(text)
    // `<${element} class="marked ${scopesToString(scopes)}">${symbol}</${element}>`
    if (colors) {
        const symbols = colors.reduce((acc, color) => {
            const symbol = unescapedText.substring(
                color.range.start.character,
                color.range.end.character,
            )
            acc[symbol] = color.highlightGroup
            return acc
        }, {})

        const symbolNames = [...new Set(Object.keys(symbols))]
        const symbolRegex = new RegExp("(" + symbolNames.join("|") + ")", "g")
        const html = unescapedText.replace(symbolRegex, (match, ...args) => {
            return `<${element} class="marked marked-${symbols[
                match
            ].toLowerCase()}">${match}</${element}>`
        })
        return createContainer(container, html)
    }
    return `<p>${text}</p>`
}

interface IConversionArgs {
    markdown: string
    tokens?: ITokens[]
    colors?: IColors[]
    type?: string
}

export const convertMarkdown = ({
    markdown,
    tokens,
    colors,
    type = "title",
}: IConversionArgs): { __html: string } => {
    marked.setOptions({
        sanitize: true,
        gfm: true,
        renderer,
    })

    switch (type) {
        case "documentation":
            renderer.code = text => {
                return createContainer("code", text)
            }
            renderer.paragraph = text => `<p>${text}</p>`
            break
        case "title":
        default:
            if (tokens) {
                renderer.paragraph = text => renderWithClasses({ text, tokens })
            } else if (colors) {
                renderer.code = text => {
                    // console.log("creating code block text: ", text)
                    // renderWithClasses({
                    //     container: "code",
                    //     colors,
                    //     text,
                    // })
                    return createContainer("code", text)
                }
                renderer.paragraph = text => renderWithClasses({ text, colors })
            } else {
                renderer.paragraph = text => `<p>${text}</p>`
            }
    }

    const html = marked(markdown)
    return { __html: html }
}
