import * as Oni from "oni-api"
import * as React from "react"

import { VersionControlManager } from "./VersionControlManager"

export default class MergeConflictBufferLayer implements Oni.BufferLayer {
    constructor(private _vcsManager: VersionControlManager) {}

    get id() {
        return "merge-conflicts"
    }

    public render(context: Oni.BufferLayerRenderContext) {
        return <>{this._getConflictMarkers()}</>
    }

    private async _getConflictMarkers() {
        const status = await this._vcsManager.getStatus()
        if (status && status.conflicted) {
            return <div>conflicted</div>
        }
        return null
    }
}
