import { BrowserWindow, TouchBar, TouchBarScrubber } from "electron"
import * as flatten from "lodash/flatten"

const { TouchBarButton /* , TouchBarLabel */, TouchBarSpacer } = TouchBar

const dummyBuffers = ["file1.txt", "file2.txt", "file3.txt", "file4.txt"]

const buttons = (buffers: string[]) =>
    buffers.map(
        buffer =>
            new TouchBarButton({
                label: buffer,
                backgroundColor: "blue",
                click: () => {
                    console.log("Clicked", buffer) // tslint:disable-line
                },
            }),
    )

const createTouchBarMenu = (browserWindow: BrowserWindow, buffers = dummyBuffers) => {
    // List needs to be scrollable

    // const scrubber = new TouchBarScrubber({
    //     items: dummyBuffers.map(buffer => ({ label: buffer })),
    //     highlight: null,
    //     selectedStyle: null,
    //     overlayStyle: null,
    //     showArrowButtons: false,
    //     mode: "free",
    //     continuous: true,
    //     select: selectedIndex => {
    //         console.log(selectedIndex)
    //     },
    // })

    const arrangement = flatten(
        buttons(buffers).map(button => [button, new TouchBarSpacer({ size: "small" })]),
    )

    // const touchBar = new TouchBar({ items: [scrubber] })
    const touchBar = new TouchBar({ items: arrangement })

    browserWindow.setTouchBar(touchBar)
}

export default createTouchBarMenu
