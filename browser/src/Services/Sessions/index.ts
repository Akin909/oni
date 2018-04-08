// import { Event, IEvent } from "oni-types"

import { Configuration } from "./../Configuration"
import { EditorManager } from "./../EditorManager"
import { SidebarManager } from "./../Sidebar"

import { SessionsPane } from "./SessionsPane"

export interface ISession {
    id: string
}

export interface ISessionProvider {}

export class NeovimSessionProvider implements ISessionProvider {
    public selectSession(session: ISession): void {
        //
    }
}

let _sessions: ISessionProvider

export const activate = (
    configuration: Configuration,
    editorManager: EditorManager,
    sidebarManager: SidebarManager,
) => {
    const sessionEnabled = configuration.getValue("sessions.enabled")

    if (!sessionEnabled) {
        return
    }

    sidebarManager.add("sessions", new SessionsPane(_sessions))
}

export const getInstance = (): ISessionProvider => _sessions
