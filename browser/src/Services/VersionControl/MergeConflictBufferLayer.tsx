import { BufferLayer, BufferLayerRenderContext } from "oni-api"
import * as React from "react"

import styled, { pixel, withProps } from "../../UI/components/common"
import { VersionControlManager } from "./"

interface IProps {
    top: number
    left: number
    height?: number
    bottom?: number
    start?: boolean
    end?: boolean
}

interface IConflictProps {
    sectionStart: number
    sectionEnd: number
    markers: JSX.Element[]
}

const MarkerSection = withProps<IProps>(styled.div).attrs({
    style: (props: IProps) => ({
        top: pixel(props.top),
        left: pixel(props.left),
        height: pixel(props.height),
    }),
})`
    width: 100%;
    border: 1px solid green;
    background-color: green;
    color: white;
    position: absolute;
`

const MarkerBody = withProps<IProps>(styled.div).attrs({
    style: (props: IProps) => ({
        top: pixel(props.top),
        left: pixel(props.left),
        bottom: pixel(props.bottom),
        height: pixel(props.height),
    }),
})`
    width: 100%;
    background-color: rgba(0, 128, 0, 0.21);
    position: absolute;
`

const log = (props: IProps) => {
    // tslint:disable
    if (props.start) {
        console.group("START =================")
        console.log("top: ", props.top)
        console.log("bottom: ", props.bottom)
        console.groupEnd()
    } else if (props.end) {
        console.group("END=================")
        console.log("top: ", props.top)
        console.log("bottom: ", props.bottom)
        console.groupEnd()
    }
    // tslint:enable
}

const ConflictMarker: React.SFC<IProps> = props => {
    log(props)
    const bodyHeight = props.end ? props.bottom - props.top : 0
    return (
        <>
            {props.start && (
                <MarkerSection
                    height={props.height}
                    left={props.left}
                    top={props.top}
                    data-id="conflict-marker"
                >
                    HEAD
                </MarkerSection>
            )}
            {props.end && (
                <>
                    <MarkerBody
                        left={props.left}
                        top={props.top + props.height}
                        height={bodyHeight}
                        data-id="conflict-marker-end"
                    />
                    <MarkerSection left={props.left} height={props.height} top={props.bottom} />
                </>
            )}
        </>
    )
}

export default class MergeConflictBufferLayer implements BufferLayer {
    private readonly markers = {
        start: "<<<<<<<",
        end: "=======",
    }

    constructor(private _vcsManager: VersionControlManager) {
        console.log("this._vcsManager: ", this._vcsManager)
    }

    get id() {
        return "merge-conflicts"
    }

    public render(context: BufferLayerRenderContext) {
        return <>{this._getConflictMarkers(context)}</>
    }

    private _isConflictMarker(line: string) {
        return line.startsWith(this.markers.start)
            ? "start"
            : line.startsWith(this.markers.end)
                ? "end"
                : null
    }

    private _getConflictMarkers(context: BufferLayerRenderContext) {
        const { markers } = context.visibleLines.reduce<IConflictProps>(
            (elements, line, currentLine) => {
                const marker = this._isConflictMarker(line)
                if (marker) {
                    const start = context.bufferToScreen({
                        character: 0,
                        line: currentLine,
                    })
                    if (start) {
                        const position = context.screenToPixel({
                            screenX: start.screenX,
                            screenY: start.screenY,
                        })
                        const top = position.pixelY
                        const left = position.pixelX

                        if (marker) {
                            if (marker === "start") {
                                elements.sectionStart = top
                            } else if (marker === "end") {
                                elements.sectionEnd = top
                            }

                            elements.markers.push(
                                <ConflictMarker
                                    left={left}
                                    end={marker === "end"}
                                    start={marker === "start"}
                                    bottom={elements.sectionEnd}
                                    top={elements.sectionStart}
                                    height={context.fontPixelHeight}
                                />,
                            )
                        }

                        return elements
                    }
                }
                return elements
            },
            { sectionStart: null, sectionEnd: null, markers: [] },
        )
        return markers
    }
}
