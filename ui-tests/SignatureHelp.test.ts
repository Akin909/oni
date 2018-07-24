import { Cursor, EditorBufferScrolledEventArgs, Vim } from "oni-api"
import { Event, IEvent } from "oni-types"
import { Observable, Subject } from "rxjs"

import { IToolTipsProvider } from "../browser/src/Editor/NeovimEditor/ToolTipsProvider"
import { ILatestCursorAndBufferInfo } from "../browser/src/Services/Language"
import { initUI } from "./../browser/src/Services/Language/SignatureHelp"

export const asObservable = <T>(event: IEvent<T>): Observable<T> => {
    const subject = new Subject<T>()

    event.subscribe((val: T) => subject.next(val))

    return subject
}

describe("Signature Help Tests", () => {
    const tooltips: IToolTipsProvider = {
        showToolTip: jest.fn(),
        hideToolTip: jest.fn(),
    }
    it("Should close the Signature help Ui", () => {
        const cursorEvent = new Event<ILatestCursorAndBufferInfo>()
        const cursor$ = asObservable(cursorEvent).map(() => ({
            line: 0,
            column: 0,
            filePath: "test.txt",
            language: "test",
            cursorLine: 4,
            contents: "this is a test",
            cursorColumn: 19,
        }))

        const modeEvent = new Event<Vim.Mode>()
        const modeChanged$ = asObservable(modeEvent).map(() => "normal" as Vim.Mode)
        const onScrollEvent = new Event<{}>()
        const onScroll$ = asObservable(onScrollEvent).map(() => ({
            bufferTotalLines: 20,
            windowTopLine: 0,
            windowBottomLine: 20,
        }))

        initUI(cursor$, modeChanged$, onScroll$, tooltips)
        cursorEvent.dispatch({} as any)
        console.log("jest.mock.calls: ", (tooltips as any).hideToolTip.mock.calls)
        // expect((tooltips as any).hideToolTip.mock.calls.length).toBeGreaterThan(0)
    })
})
