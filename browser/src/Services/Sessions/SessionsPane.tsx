// import * as Oni from "oni-api"
import { Event } from "oni-types"
import * as React from "react"
import { ISessionProvider } from "./"

interface ISession {
    id: string
    name: string
}

export class SessionsPane {
    private _onEnter = new Event<void>()
    private _onLeave = new Event<void>()
    private _sessions: ISession[]

    constructor(private _provider: ISessionProvider) {
        // this._sessions = _provider.sessions
    }

    get id(): string {
        return "oni.sidebar.sessions"
    }

    public get title(): string {
        return "Marks"
    }

    public enter(): void {
        this._onEnter.dispatch()
    }

    public leave(): void {
        this._onLeave.dispatch()
    }

    public render() {
        return <SessionsPaneComponent sessions={this._sessions} />
    }
}

interface IProps {
    sessions: ISession[]
}
interface IState {}

export class SessionsPaneComponent extends React.Component<IProps, IState> {
    public render() {
        return <div>Sessions</div>
    }
}
