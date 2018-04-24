import { BrowserWindow, TouchBar } from "electron"
// import * as flatten from "lodash/flatten"

const {
    TouchBarButton,
    TouchBarSegmentedControl /* , TouchBarLabel */ /* , TouchBarSpacer */,
} = TouchBar

// const dummyBuffers = [{ name: "file1.txt" }, { name: "file2.txt" }, " name: name:file3.txt", "file4.txt"]

interface Buffers {
    name: string
    fullPath: string
}

const buttons = (buffers: Buffers[], onClick: (buffer: string) => void) =>
    buffers.map(
        buffer =>
            new TouchBarButton({
                label: buffer.name,
                backgroundColor: "blue",
                click: () => onClick(buffer.fullPath),
            }),
    )

const createTouchBarMenu = (browserWindow: BrowserWindow, buffers: Buffers[]) => {
    // List needs to be scrollable
    const onClick = (filePath: string) => browserWindow.webContents.send("open-file", filePath)

    // const scrubber = new TouchBarScrubber({
    //     items: buffers.map(buffer => ({ label: buffer.name })),
    //     highlight: null,
    //     selectedStyle: null,
    //     overlayStyle: null,
    //     showArrowButtons: false,
    //     mode: "free",
    //     continuous: true,
    //     select: selectedIndex => {
    //         const buffer = buffers[selectedIndex]
    //         onClick(buffer.fullPath)
    //     },
    // })
    //
    // const arrangement = flatten(
    //     buttons(buffers, onClick).map(button => [button, new TouchBarSpacer({ size: "small" })]),
    // )

    const segmentedControl = new TouchBarSegmentedControl({
        segmentStyle: "automatic",
        mode: "single",
        segments: buttons(buffers, onClick),
        change: selectedIndex => {
            const buffer = buffers[selectedIndex]
            onClick(buffer.fullPath)
        },
    })

    const touchBar = new TouchBar({ items: [segmentedControl] })
    // const touchBar = new TouchBar({ items: [scrubber] })
    // const touchBar = new TouchBar({ items: arrangement })

    browserWindow.setTouchBar(touchBar)
}

export default createTouchBarMenu
