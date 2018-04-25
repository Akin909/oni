import { BrowserWindow, TouchBar } from "electron"
// import * as flatten from "lodash/flatten"

const {
    // TouchBarSegmentedControl,
    TouchBarScrubber,
    // TouchBarButton,
    // TouchBarLabel , TouchBarSpacer ,
} = TouchBar

interface Buffers {
    name: string
    fullPath: string
}

// const buttons = (buffers: Buffers[], onClick: (buffer: string) => void) =>
//     buffers.map(
//         buffer =>
//             new TouchBarButton({
//                 label: buffer.name,
//                 backgroundColor: "blue",
//                 click: () => onClick(buffer.fullPath),
//             }),
//     )
//

type Items = Array<{ label: string }>
const getNames = (buffers: Buffers[]): Items => buffers.map(b => ({ label: b.name }))

const createTouchBarMenu = () => (browserWindow: BrowserWindow, buffers: Buffers[]) => {
    // List needs to be scrollable
    let items: Items

    return () => {
        const onClick = (filePath: string) => browserWindow.webContents.send("open-file", filePath)
        items = items || getNames(buffers)

        const newItems = [...new Set([...getNames(buffers), ...items])]
        items.push(...newItems)

        const scrubber = new TouchBarScrubber({
            items,
            highlight: null,
            selectedStyle: "background",
            overlayStyle: "outline",
            showArrowButtons: true,
            mode: "free",
            continuous: true,
            select: selectedIndex => {
                const buffer = buffers[selectedIndex]
                onClick(buffer.fullPath)
            },
        })

        // const arrangement = flatten(
        //     buttons(buffers, onClick).map(button => [button, new TouchBarSpacer({ size: "small" })]),
        // )

        // const segmentedControl = new TouchBarSegmentedControl({
        //     segmentStyle: "separated",
        //     mode: "buttons",
        //     segments: buffers.map(buffer => ({ label: buffer.name, icon: null, enabled: true })),
        //     change: selectedIndex => {
        //         const buffer = buffers[selectedIndex]
        //         onClick(buffer.fullPath)
        //     },
        // })
        //

        const touchBar = new TouchBar({ items: [scrubber] })

        browserWindow.setTouchBar(touchBar)
    }
}

const createWithState = createTouchBarMenu()
export default createWithState
