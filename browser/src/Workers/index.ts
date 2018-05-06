import * as Log from "./../Log"

export interface IMessageEvent {
    data: { event: string; method: string; args: any }
}

type ErrorHandler = (error: ErrorEvent) => any
type Listener = (args?: any) => any

export default class WebWorker {
    private _listeners = new Map<string, Listener>()
    private _worker: Worker

    constructor(path: string, errorHandler = (e: ErrorEvent) => Log.warn(e.message)) {
        this._worker = new Worker(`./${path}.worker`)
        this._worker.onerror = errorHandler
        this._worker.onmessage = ({ data: { event, method, args } }: IMessageEvent) => {
            if (this._listeners.has(method)) {
                this._listeners.get(method)(args)
            }
        }
    }

    public postMessage = (event: string, args: any) => {
        this._worker.postMessage(event, args)
    }

    public terminate() {
        this._worker.terminate()
    }

    public setErrorHandler(errorHandler: ErrorHandler) {
        this._worker.onerror = event => {
            errorHandler(event)
        }
    }
    public addListeners = (name: string, listener: Listener) => {
        this._listeners.set(name, listener)
    }

    public removeListener = (name: string) => {
        this._listeners.delete(name)
    }
}
