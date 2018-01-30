/**
 * Workspace.ts
 *
 * The 'workspace' is responsible for managing the state of the current project:
 *  - The current / active directory (and 'Open Folder')
 */

import { remote } from "electron"
import * as findup from "find-up"
import { stat } from "fs"
import * as path from "path"
import { promisify } from "util"

import "rxjs/add/observable/defer"
import "rxjs/add/observable/from"
import "rxjs/add/operator/concatMap"
import "rxjs/add/operator/toPromise"
import { Observable } from "rxjs/Observable"
import * as types from "vscode-languageserver-types"

import * as Oni from "oni-api"
import { Event, IEvent } from "oni-types"

import * as Log from "./../../Log"
import * as Helpers from "./../../Plugins/Api/LanguageClient/LanguageClientHelpers"

import { Configuration } from "./../Configuration"
import { EditorManager } from "./../EditorManager"
import { convertTextDocumentEditsToFileMap } from "./../Language/Edits"

import * as WorkspaceCommands from "./WorkspaceCommands"
import { WorkspaceConfiguration } from "./WorkspaceConfiguration"

const fsStat = promisify(stat)

// Candidate interface to promote to Oni API
export interface IWorkspace extends Oni.Workspace {
    activeWorkspace: string

    applyEdits(edits: types.WorkspaceEdit): Promise<void>
}

export class Workspace implements IWorkspace {
    private _onDirectoryChangedEvent = new Event<string>()
    private _onFocusGainedEvent = new Event<Oni.Buffer>()
    private _onFocusLostEvent = new Event<Oni.Buffer>()
    private _mainWindow = remote.getCurrentWindow()
    private _lastActiveBuffer: Oni.Buffer
    private _activeWorkspace: string

    public get activeWorkspace(): string {
        return this._activeWorkspace
    }

    constructor(private _editorManager: EditorManager, private _configuration: Configuration) {
        this._mainWindow.on("focus", () => {
            this._onFocusGainedEvent.dispatch(this._lastActiveBuffer)
        })

        this._mainWindow.on("blur", () => {
            this._lastActiveBuffer = this._editorManager.activeEditor.activeBuffer
            this._onFocusLostEvent.dispatch(this._lastActiveBuffer)
        })
    }

    public get onDirectoryChanged(): IEvent<string> {
        return this._onDirectoryChangedEvent
    }

    public async changeDirectory(newDirectory: string) {
        const exists = await this.pathIsDir(newDirectory)
        const dir = exists ? newDirectory : null
        if (newDirectory && exists) {
            process.chdir(newDirectory)
        }

        this._activeWorkspace = dir
        this._onDirectoryChangedEvent.dispatch(dir)
    }

    public async applyEdits(edits: types.WorkspaceEdit): Promise<void> {
        let editsToUse = edits
        if (edits.documentChanges) {
            editsToUse = convertTextDocumentEditsToFileMap(edits.documentChanges)
        }

        const files = Object.keys(editsToUse)

        // TODO: Show modal to grab input
        // await editorManager.activeEditor.openFiles(files)

        const deferredEdits = await files.map((fileUri: string) => {
            return Observable.defer(async () => {
                const changes = editsToUse[fileUri]
                const fileName = Helpers.unwrapFileUriPath(fileUri)
                // TODO: Sort changes?
                Log.verbose("[Workspace] Opening file: " + fileName)
                const buf = await this._editorManager.activeEditor.openFile(fileName)
                Log.verbose(
                    "[Workspace] Got buffer for file: " + buf.filePath + " and id: " + buf.id,
                )
                await buf.applyTextEdits(changes)
                Log.verbose("[Workspace] Applied " + changes.length + " edits to buffer")
            })
        })

        await Observable.from(deferredEdits)
            .concatMap(de => de)
            .toPromise()

        Log.verbose("[Workspace] Completed applying edits")

        // Hide modal
    }

    public get onFocusGained(): IEvent<Oni.Buffer> {
        return this._onFocusGainedEvent
    }

    public get onFocusLost(): IEvent<Oni.Buffer> {
        return this._onFocusLostEvent
    }

    public pathIsDir = async (p: string) => {
        try {
            const stats = await fsStat(p)
            return stats.isDirectory()
        } catch (error) {
            Log.info(error)
            return false
        }
    }

    public navigateToProjectRoot = async (bufferPath: string) => {
        const projectMarkers = this._configuration.getValue("workspace.autoDetectRootFiles")
        const cwd = path.dirname(bufferPath)
        const filePath = await findup(projectMarkers, { cwd })
        if (filePath) {
            const dir = path.dirname(filePath)
            process.chdir(dir)
            this._activeWorkspace = dir
            this._onDirectoryChangedEvent.dispatch(dir)
        }
    }

    public autoDetectWorkspace() {
        const { filePath } = this._editorManager.activeEditor.activeBuffer
        const settings = this._configuration.getValue("workspace.autoDetectWorkspace")
        switch (settings) {
            case "never":
                return null
            case "always":
                return this._editorManager.activeEditor.onBufferEnter.subscribe(buffer =>
                    this.navigateToProjectRoot(buffer.filePath),
                )
            case "noworkspace":
            default:
                return !this._activeWorkspace ? this.navigateToProjectRoot(filePath) : null
        }
    }
}

let _workspace: Workspace = null
let _workspaceConfiguration: WorkspaceConfiguration = null

export const activate = (configuration: Configuration, editorManager: EditorManager): void => {
    _workspace = new Workspace(editorManager, configuration)

    _workspaceConfiguration = new WorkspaceConfiguration(configuration, _workspace)

    const defaultWorkspace = configuration.getValue("workspace.defaultWorkspace")

    if (defaultWorkspace) {
        _workspace.changeDirectory(defaultWorkspace)
    }

    _workspace.onDirectoryChanged.subscribe(newDirectory => {
        configuration.setValues({ "workspace.defaultWorkspace": newDirectory }, true)
    })

    WorkspaceCommands.activateCommands(configuration, editorManager, _workspace)
}

export const getInstance = (): Workspace => {
    return _workspace
}

export const getConfigurationInstance = (): WorkspaceConfiguration => {
    return _workspaceConfiguration
}
