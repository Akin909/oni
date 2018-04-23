import { BrowserWindow, TouchBar } from "electron"
import * as flatten from "lodash/flatten"

const { TouchBarButton /* , TouchBarLabel */, TouchBarSpacer } = TouchBar

const dummyBuffers = ["dummy1", "dummy1", "dummy1", "dummy1"]

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
    const arrangement = flatten(
        buttons(buffers).map(button => [button, new TouchBarSpacer({ size: "small" })]),
    )
    const touchBar = new TouchBar({ items: arrangement })

    browserWindow.setTouchBar(touchBar)
}

export default createTouchBarMenu
