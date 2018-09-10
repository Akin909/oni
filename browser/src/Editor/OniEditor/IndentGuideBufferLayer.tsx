import * as React from "react"

import * as detectIndent from "detect-indent"
import * as flatten from "lodash/flatten"
import * as last from "lodash/last"
import * as isEqual from "lodash/isEqual"
import * as memoize from "lodash/memoize"
import * as Oni from "oni-api"

import { IBuffer } from "../BufferManager"
import styled, { pixel, withProps } from "./../../UI/components/common"

interface IWrappedLine {
    start: number
    end: number
    line: string
}

interface IProps {
    height: number
    left: number
    top: number
    color?: string
}

interface ConfigOptions {
    skipFirst: boolean
    color?: string
}

interface LinePropsWithLevels extends IndentLinesProps {
    levelOfIndentation: number
}

interface IndentLinesProps {
    top: number
    left: number
    height: number
    line: string
    indentBy: number
    indentSize: number
    characterWidth: number
}

const Container = styled.div``

const IndentLine = withProps<IProps>(styled.span).attrs({
    style: ({ height, left, top }: IProps) => ({
        height: pixel(height),
        left: pixel(left),
        top: pixel(top),
    }),
})`
    border-left: 1px solid ${p => p.color || "rgba(100, 100, 100, 0.4)"};
    position: absolute;
`

interface IndentLayerArgs {
    buffer: IBuffer
    configuration: Oni.Configuration
}

interface IIndentLineProps {
    userSpacing: number
    configuration: Oni.Configuration
    context: Oni.BufferLayerRenderContext
}

interface IIndentLineState {
    visibleLines: string[]
}

const cache = new Map<number, string>()

const getLinesFromCache = (topLine: number, propLines: string[], stateLines: string[]) => {
    propLines.forEach((line, index) => {
        const currentLineNumber = topLine + index
        if (!cache.has(currentLineNumber)) {
            cache.set(topLine, line)
        }
    })
    return cache.values()
}

class IndentGuideLines extends React.Component<IIndentLineProps, IIndentLineState> {
    public state = {
        visibleLines: getLinesFromCache(
            this.props.context.topBufferLine,
            this.props.context.visibleLines,
        ),
    }

    public static getDerivedStateFromProps(prevProps: IIndentLineProps) {
        console.log("cache: ", cache)
        return {
            visibleLines: getLinesFromCache(
                prevProps.context.topBufferLine,
                prevProps.context.visibleLines,
            ),
        }
    }

    componentShouldUpdate(prevProps: IIndentLineProps) {
        return !isEqual(prevProps.context.visibleLines, this.props.context.visibleLines)
    }

    private _getIndentLines = (guidePositions: IndentLinesProps[], options: ConfigOptions) => {
        return flatten(
            guidePositions.map((props, idx) => {
                const indents: JSX.Element[] = []
                // Create a line per indentation
                for (
                    let levelOfIndentation = 0;
                    levelOfIndentation < props.indentBy;
                    levelOfIndentation++
                ) {
                    const lineProps = { ...props, levelOfIndentation }
                    const adjustedLeft = this._calculateLeftPosition(lineProps)
                    const shouldSkip = this._determineIfShouldSkip(lineProps, options)
                    const key = `${props.line.trim()}-${idx}-${levelOfIndentation}`
                    indents.push(
                        !shouldSkip && (
                            <IndentLine
                                key={key}
                                top={props.top}
                                left={adjustedLeft}
                                color={options.color}
                                height={props.height}
                                data-id="indent-line"
                            />
                        ),
                    )
                }
                return indents
            }),
        )
    }

    private _determineIfShouldSkip(props: LinePropsWithLevels, options: ConfigOptions) {
        const skipFirstIndentLine =
            options.skipFirst && props.levelOfIndentation === props.indentBy - 1

        return skipFirstIndentLine
    }

    /**
     * Remove one indent from left positioning and move lines slightly inwards -
     * by a third of a character for a better visual appearance
     */
    private _calculateLeftPosition(props: LinePropsWithLevels) {
        const adjustedLeft =
            props.left -
            props.indentSize -
            props.levelOfIndentation * props.indentSize +
            props.characterWidth / 3

        return adjustedLeft
    }

    private _getWrappedLines(context: Oni.BufferLayerRenderContext): IWrappedLine[] {
        const { lines } = context.visibleLines.reduce(
            (acc, line, index) => {
                const currentLine = context.topBufferLine + index
                const bufferInfo = context.bufferToScreen({ line: currentLine, character: 0 })

                if (bufferInfo && bufferInfo.screenY) {
                    const { screenY: screenLine } = bufferInfo
                    if (acc.expectedLine !== screenLine) {
                        acc.lines.push({
                            start: acc.expectedLine,
                            end: screenLine,
                            line,
                        })
                        acc.expectedLine = screenLine + 1
                    } else {
                        acc.expectedLine += 1
                    }
                }
                return acc
            },
            { lines: [], expectedLine: 1 },
        )
        return lines
    }

    private _regulariseIndentation(indentation: detectIndent.IndentInfo) {
        const isOddBy = indentation.amount % this.props.userSpacing
        const amountToIndent = isOddBy ? indentation.amount - isOddBy : indentation.amount
        return amountToIndent
    }

    /**
     * Calculates the position of each indent guide element using shiftwidth or tabstop if no
     * shift width available
     * @name _renderIndentLines
     * @function
     * @param {Oni.BufferLayerRenderContext} bufferLayerContext The buffer layer context
     * @returns {JSX.Element[]} An array of react elements
     */
    private _renderIndentLines = (bufferLayerContext: Oni.BufferLayerRenderContext) => {
        // TODO: If the beginning of the visible lines is wrapping no lines are drawn
        const wrappedScreenLines = this._getWrappedLines(bufferLayerContext)

        const options = {
            color: this.props.configuration.getValue<string>("experimental.indentLines.color"),
            skipFirst: this.props.configuration.getValue<boolean>(
                "experimental.indentLines.skipFirst",
            ),
        }

        const { visibleLines, fontPixelHeight, fontPixelWidth, topBufferLine } = bufferLayerContext
        const indentSize = this.props.userSpacing * fontPixelWidth

        // TODO: implement caching
        const { allIndentations } = visibleLines.reduce(
            (acc, line, currenLineNumber) => {
                const rawIndentation = detectIndent(line)

                const regularisedIndent = this._regulariseIndentation(rawIndentation)

                const previous = last(acc.allIndentations)
                const height = Math.ceil(fontPixelHeight)

                // start position helps determine the initial indent offset
                const startPosition = bufferLayerContext.bufferToScreen({
                    line: topBufferLine,
                    character: regularisedIndent,
                })

                const wrappedLine = wrappedScreenLines.find(wrapped => wrapped.line === line)
                const levelsOfWrapping = wrappedLine ? wrappedLine.end - wrappedLine.start : 1
                const adjustedHeight = height * levelsOfWrapping

                if (!startPosition) {
                    return acc
                }

                const { pixelX: left, pixelY: top } = bufferLayerContext.screenToPixel({
                    screenX: startPosition.screenX,
                    screenY: currenLineNumber,
                })

                const adjustedTop = top + acc.wrappedHeightAdjustment

                // Only adjust height for Subsequent lines!
                if (wrappedLine) {
                    acc.wrappedHeightAdjustment += adjustedHeight
                }

                if (!line && previous) {
                    acc.allIndentations.push({
                        ...previous,
                        line,
                        top: adjustedTop,
                    })
                    return acc
                }

                const indent = {
                    left,
                    line,
                    indentSize,
                    top: adjustedTop,
                    height: adjustedHeight,
                    characterWidth: fontPixelWidth,
                    indentBy: regularisedIndent / this.props.userSpacing,
                }

                acc.allIndentations.push(indent)

                return acc
            },
            { allIndentations: [], wrappedHeightAdjustment: 0 },
        )

        return this._getIndentLines(allIndentations, options)
    }
    render() {
        console.log("RENDERING!!!!!")
        return this._renderIndentLines(this.props.context)
    }
}

class IndentGuideBufferLayer implements Oni.BufferLayer {
    public render = memoize((bufferLayerContext: Oni.BufferLayerRenderContext) => {
        return (
            <Container id={this.id}>
                <IndentGuideLines
                    context={bufferLayerContext}
                    userSpacing={this._userSpacing}
                    configuration={this._configuration}
                />
            </Container>
        )
    })

    private _buffer: IBuffer
    private _userSpacing: number
    private _configuration: Oni.Configuration

    constructor({ buffer, configuration }: IndentLayerArgs) {
        this._buffer = buffer
        this._configuration = configuration
        this._userSpacing = this._buffer.shiftwidth || this._buffer.tabstop
    }
    get id() {
        return "indent-guides"
    }

    get friendlyName() {
        return "Indent Guide Lines"
    }
}

export default IndentGuideBufferLayer
