import * as capitalize from "lodash/capitalize"
import * as Log from "oni-core-logging"
import * as React from "react"
import { Provider, Store } from "react-redux"

import { VersionControlProvider, VersionControlView } from "./"
import { IWorkspace } from "./../Workspace"
import { ISendVCSNotification } from "./VersionControlManager"
import { StatusResult } from "./VersionControlProvider"
import { VersionControlState } from "./VersionControlStore"

export default class VersionControlPane {
    public get id(): string {
        return "oni.sidebar.vcs"
    }

    public get title(): string {
        return capitalize(this._vcsProvider.name)
    }

    constructor(
        private _workspace: IWorkspace,
        private _vcsProvider: VersionControlProvider,
        private _store: Store<VersionControlState>,
        private _sendNotification: ISendVCSNotification,
        public getStatus: () => Promise<void | StatusResult>,
    ) {}

    public enter(): void {
        this._store.dispatch({ type: "ENTER" })
        this._workspace.onDirectoryChanged.subscribe(async () => {
            await this.getStatus()
        })
    }

    public leave(): void {
        this._store.dispatch({ type: "LEAVE" })
    }

    public stageFile = async (file: string) => {
        const { activeWorkspace } = this._workspace
        try {
            await this._vcsProvider.stageFile(file, activeWorkspace)
        } catch (e) {
            this._sendNotification({
                detail: e.message,
                level: "warn",
                title: "Error Staging File",
            })
        }
    }

    public setError = async (e: Error) => {
        Log.warn(`version control pane failed to render due to ${e.message}`)
        this._store.dispatch({ type: "ERROR" })
    }

    public handleSelection = async (file: string): Promise<void> => {
        const { status } = this._store.getState()
        switch (true) {
            case status.untracked.includes(file):
            case status.modified.includes(file):
                await this.stageFile(file)
                break
            case status.staged.includes(file):
            default:
                break
        }
    }

    public render(): JSX.Element {
        return (
            <Provider store={this._store}>
                <VersionControlView
                    setError={this.setError}
                    getStatus={this.getStatus}
                    handleSelection={this.handleSelection}
                />
            </Provider>
        )
    }
}
