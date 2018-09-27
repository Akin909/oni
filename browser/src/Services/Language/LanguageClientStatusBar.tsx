/**
 * LanguageClientStatusBar.tsx
 *
 * Implements status bar for Oni
 */

import * as electron from "electron"
import * as React from "react"

import * as Oni from "oni-api"

import styled, { themeGet } from "./../../UI/components/common"
import { Icon } from "./../../UI/Icon"

export class LanguageClientStatusBar {
    private _item: Oni.StatusBarItem
    private _fileType: string

    constructor(private _oni: Oni.Plugin.Api) {
        this._item = this._oni.statusBar.createItem(0, "oni.status.fileType")
    }

    public show(fileType: string): void {
        this._fileType = fileType
        this._item.setContents(
            <StatusBarRenderer
                state={LanguageClientState.NotAvailable}
                language={this._fileType}
            />,
        )
        this._item.show()
    }

    public setStatus(status: LanguageClientState): void {
        this._item.setContents(<StatusBarRenderer state={status} language={this._fileType} />)
    }

    public hide(): void {
        this._item.hide()
    }
}

export enum LanguageClientState {
    NotAvailable = 0,
    Initializing,
    Initialized,
    Active,
    Error,
}

const SpinnerIcon = "circle-o-notch"
const ConnectedIcon = "bolt"
const ErrorIcon = "exclamation-circle"

const getIconFromStatus = (status: LanguageClientState) => {
    switch (status) {
        case LanguageClientState.NotAvailable:
            return null
        case LanguageClientState.Initializing:
            return SpinnerIcon
        case LanguageClientState.Error:
            return ErrorIcon
        default:
            return ConnectedIcon
    }
}

const getClassNameFromstatus = (status: LanguageClientState) => {
    switch (status) {
        case LanguageClientState.Initializing:
            return "rotate-animation"
        default:
            return ""
    }
}

interface StatusBarRendererProps {
    state: LanguageClientState
    language: string
}

const StatusBarItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background-color: ${themeGet(
        "statusBar.item.language.background",
        "statusBar.item.background",
    )};
    color: ${themeGet("statusBar.item.language.foreground", "statusBar.item.foreground")};
    padding-right: 8px;
    padding-left: 8px;
`

const Language = styled.span``

const IconContainer = styled.span`
    padding-right: 6px;
    min-width: 14px;
    text-align: center;
`

const openDevTools = () => {
    electron.remote.getCurrentWindow().webContents.openDevTools()
}

const StatusBarRenderer: React.SFC<StatusBarRendererProps> = props => {
    const onClick = props.state === LanguageClientState.Error ? openDevTools : null
    const iconName = getIconFromStatus(props.state)

    const icon = iconName ? (
        <IconContainer>
            <Icon name={iconName} className={getClassNameFromstatus(props.state)} />
        </IconContainer>
    ) : null

    return (
        <StatusBarItem onClick={onClick}>
            {icon}
            <Language>{props.language}</Language>
        </StatusBarItem>
    )
}
