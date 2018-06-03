/**
 * ExplorerSplit.tsx
 *
 */

import * as React from "react"
import * as DND from "react-dnd"
import HTML5Backend from "react-dnd-html5-backend"
import { connect } from "react-redux"
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from "react-virtualized"
import { compose } from "redux"

import { CSSTransition, TransitionGroup } from "react-transition-group"

import { css, enableMouse, styled } from "./../../UI/components/common"
import { TextInputView } from "./../../UI/components/LightweightText"
import { SidebarEmptyPaneView } from "./../../UI/components/SidebarEmptyPaneView"
import { SidebarContainerView, SidebarItemView } from "./../../UI/components/SidebarItemView"
import { Sneakable } from "./../../UI/components/Sneakable"
import { VimNavigator } from "./../../UI/components/VimNavigator"
import { fontSizeInPx } from "./../../Utility"
import { DragAndDrop, Droppeable } from "./../DragAndDrop"

import { commandManager } from "./../CommandManager"
import { configuration } from "./../Configuration"
import { FileIcon } from "./../FileIcon"

import * as ExplorerSelectors from "./ExplorerSelectors"
import { IExplorerState } from "./ExplorerStore"

type Node = ExplorerSelectors.ExplorerNode

export interface INodeViewProps {
    measure: () => void
    moveFileOrFolder: (source: Node, dest: Node) => void
    node: ExplorerSelectors.ExplorerNode
    isSelected: boolean
    onClick: () => void
    onCancelRename: () => void
    onCompleteRename: (newName: string) => void
    onCancelCreate?: () => void
    onCompleteCreate?: (path: string) => void
    yanked: string[]
    updated?: string[]
    isRenaming: Node
    isCreating: boolean
    children?: React.ReactNode
}

export const NodeWrapper = styled.div`
    cursor: pointer;
    &:hover {
        text-decoration: underline;
    }
`

const stopPropagation = (fn: () => void) => {
    return (e?: React.MouseEvent<HTMLElement>) => {
        if (e) {
            e.stopPropagation()
        }
        fn()
    }
}

const Types = {
    FILE: "FILE",
    FOLDER: "FOLDER",
}

interface IMoveNode {
    drop: {
        node: ExplorerSelectors.ExplorerNode
    }
    drag: {
        node: ExplorerSelectors.ExplorerNode
    }
}

const NodeTransitionWrapper = styled.div`
    transition: all 400ms 50ms ease-in-out;

    &.move-enter {
        opacity: 0.01;
        transform: scale(0.9);
    }

    &.move-enter-active {
        transform: scale(1);
        opacity: 1;
    }
`

interface ITransitionProps {
    children: React.ReactNode
    updated: boolean
}

const Transition = ({ children, updated }: ITransitionProps) => (
    <CSSTransition in={updated} classNames="move" timeout={1000}>
        <NodeTransitionWrapper className={updated && "move"}>{children}</NodeTransitionWrapper>
    </CSSTransition>
)

const renameStyles = css`
    width: 100%;
    background-color: inherit;
    color: inherit;
    font-size: inherit;
    font-family: inherit;
    padding: 0.5em;
    box-sizing: border-box;
    border: 2px solid ${p => p.theme["highlight.mode.normal.background"]} !important;
`

const createStyles = css`
    ${renameStyles};
    margin-top: 0.2em;
`

export class NodeView extends React.PureComponent<INodeViewProps> {
    public moveFileOrFolder = ({ drag, drop }: IMoveNode) => {
        this.props.moveFileOrFolder(drag.node, drop.node)
    }

    public isSameNode = ({ drag, drop }: IMoveNode) => {
        return !(drag.node.name === drop.node.name)
    }

    public componentDidUpdate(prevProps: INodeViewProps) {
        if (
            prevProps.isCreating !== this.props.isCreating ||
            prevProps.isRenaming !== this.props.isRenaming
        ) {
            this.props.measure()
        }
    }

    public render(): JSX.Element {
        const { isCreating, isRenaming, isSelected, node } = this.props
        const renameInProgress = isRenaming.name === node.name && isSelected && !isCreating
        const creationInProgress = isCreating && isSelected && !renameInProgress
        return (
            <NodeWrapper>
                {renameInProgress ? (
                    <TextInputView
                        styles={renameStyles}
                        onCancel={this.props.onCancelRename}
                        onComplete={this.props.onCompleteRename}
                    />
                ) : (
                    <div>
                        {this.getElement()}
                        {creationInProgress && (
                            <TextInputView
                                styles={createStyles}
                                onCancel={this.props.onCancelCreate}
                                onComplete={this.props.onCompleteCreate}
                            />
                        )}
                    </div>
                )}
            </NodeWrapper>
        )
    }

    public hasUpdated = (path: string) =>
        !!this.props.updated && this.props.updated.some(nodePath => nodePath === path)

    public getElement(): JSX.Element {
        const { node } = this.props
        const yanked = this.props.yanked.includes(node.id)

        switch (node.type) {
            case "file":
                return (
                    <DragAndDrop
                        onDrop={this.moveFileOrFolder}
                        dragTarget={Types.FILE}
                        accepts={[Types.FILE, Types.FOLDER]}
                        isValidDrop={this.isSameNode}
                        node={node}
                        render={({ canDrop, isDragging, didDrop, isOver }) => {
                            const updated = this.hasUpdated(node.filePath)
                            return (
                                <Transition updated={updated}>
                                    <SidebarItemView
                                        updated={updated}
                                        yanked={yanked}
                                        isOver={isOver && canDrop}
                                        didDrop={didDrop}
                                        canDrop={canDrop}
                                        text={node.name}
                                        isFocused={this.props.isSelected}
                                        isContainer={false}
                                        indentationLevel={node.indentationLevel}
                                        onClick={stopPropagation(this.props.onClick)}
                                        icon={<FileIcon fileName={node.name} isLarge={true} />}
                                    />
                                </Transition>
                            )
                        }}
                    />
                )
            case "container":
                return (
                    <Droppeable
                        accepts={[Types.FILE, Types.FOLDER]}
                        onDrop={this.moveFileOrFolder}
                        isValidDrop={() => true}
                        render={({ isOver }) => {
                            return (
                                <SidebarContainerView
                                    yanked={yanked}
                                    isOver={isOver}
                                    isContainer={true}
                                    isExpanded={node.expanded}
                                    text={node.name}
                                    isFocused={this.props.isSelected}
                                    onClick={stopPropagation(this.props.onClick)}
                                />
                            )
                        }}
                    />
                )
            case "folder":
                return (
                    <DragAndDrop
                        accepts={[Types.FILE, Types.FOLDER]}
                        dragTarget={Types.FOLDER}
                        isValidDrop={this.isSameNode}
                        onDrop={this.moveFileOrFolder}
                        node={node}
                        render={({ isOver, didDrop, canDrop }) => {
                            const updated = this.hasUpdated(node.folderPath)
                            return (
                                <Transition updated={updated}>
                                    <SidebarContainerView
                                        yanked={yanked}
                                        updated={updated}
                                        didDrop={didDrop}
                                        isOver={isOver && canDrop}
                                        isContainer={false}
                                        isExpanded={node.expanded}
                                        text={node.name}
                                        isFocused={this.props.isSelected}
                                        indentationLevel={node.indentationLevel}
                                        onClick={stopPropagation(this.props.onClick)}
                                    />
                                </Transition>
                            )
                        }}
                    />
                )
            default:
                return <div>{JSON.stringify(node)}</div>
        }
    }
}

export interface IExplorerViewContainerProps {
    moveFileOrFolder: (source: Node, dest: Node) => void
    onSelectionChanged: (id: string) => void
    onClick: (id: string) => void
    onCancelRename: () => void
    onCompleteRename: (newName: string) => void
    yanked?: string[]
    isCreating?: boolean
    isRenaming?: Node
    onCancelCreate?: () => void
    onCompleteCreate?: (path: string) => void
    fontSize: string
}

export interface IExplorerViewProps extends IExplorerViewContainerProps {
    nodes: ExplorerSelectors.ExplorerNode[]
    isActive: boolean
    updated: string[]
}

interface ISneakableNode extends IExplorerViewProps {
    node: Node
    selectedId: string
    measure: () => void
}

const SneakableNode = ({ node, selectedId, ...props }: ISneakableNode) => {
    const handleClick = () => {
        props.onClick(node.id)
    }

    const isSelected = node.id === selectedId

    return (
        <Sneakable callback={handleClick}>
            <NodeView
                node={node}
                isSelected={isSelected}
                isCreating={props.isCreating}
                onCancelCreate={props.onCancelCreate}
                onCompleteCreate={props.onCompleteCreate}
                onCompleteRename={props.onCompleteRename}
                isRenaming={props.isRenaming}
                onCancelRename={props.onCancelRename}
                updated={props.updated}
                yanked={props.yanked}
                moveFileOrFolder={props.moveFileOrFolder}
                measure={props.measure}
                onClick={handleClick}
            />
        </Sneakable>
    )
}

const ExplorerContainer = styled.div`
    height: 100%;
    ${enableMouse};
`

function getDefaultHeight(fontSize: string) {
    const size = fontSizeInPx({ fontSize })
    const padding = 5
    return size + padding
}

const cache = new CellMeasurerCache({
    defaultHeight: getDefaultHeight(configuration.getValue("ui.fontSize")),
    fixedWidth: true,
})

export class ExplorerView extends React.PureComponent<IExplorerViewProps> {
    public openWorkspaceFolder = () => {
        commandManager.executeCommand("workspace.openFolder")
    }

    public getSelectedNode = (selectedId: string) => {
        return this.props.nodes.findIndex(n => selectedId === n.id)
    }

    public render(): JSX.Element {
        const ids = this.props.nodes.map(node => node.id)
        const isActive = this.props.isActive && !this.props.isRenaming && !this.props.isCreating

        if (!this.props.nodes || !this.props.nodes.length) {
            return (
                <SidebarEmptyPaneView
                    active={this.props.isActive}
                    contentsText="Nothing to show here, yet!"
                    actionButtonText="Open a Folder"
                    onClickButton={this.openWorkspaceFolder}
                />
            )
        }

        return (
            <TransitionGroup style={{ height: "100%" }}>
                <VimNavigator
                    ids={ids}
                    active={isActive}
                    style={{ height: "100%" }}
                    onSelected={id => this.props.onClick(id)}
                    onSelectionChanged={this.props.onSelectionChanged}
                    render={selectedId => {
                        return (
                            <ExplorerContainer className="explorer">
                                <AutoSizer>
                                    {measurements => (
                                        <List
                                            {...measurements}
                                            overscanRowCount={3}
                                            scrollToAlignment="end"
                                            rowHeight={cache.rowHeight}
                                            deferredMeasurementCache={cache}
                                            rowCount={this.props.nodes.length}
                                            scrollToIndex={this.getSelectedNode(selectedId)}
                                            rowRenderer={({ index, style, key, parent }) => {
                                                const typelessParent = parent as any
                                                const node = this.props.nodes[index]
                                                return (
                                                    <CellMeasurer
                                                        key={key}
                                                        cache={cache}
                                                        columnIndex={0}
                                                        rowIndex={index}
                                                        parent={typelessParent}
                                                    >
                                                        {({ measure }) => (
                                                            <div style={style}>
                                                                <SneakableNode
                                                                    {...this.props}
                                                                    node={node}
                                                                    key={node.id}
                                                                    selectedId={selectedId}
                                                                    measure={measure}
                                                                />
                                                            </div>
                                                        )}
                                                    </CellMeasurer>
                                                )
                                            }}
                                        />
                                    )}
                                </AutoSizer>
                            </ExplorerContainer>
                        )
                    }}
                />
            </TransitionGroup>
        )
    }
}

const mapStateToProps = (
    state: IExplorerState,
    containerProps: IExplorerViewContainerProps,
): IExplorerViewProps => {
    const yanked = state.register.yank.map(node => node.id)
    const {
        register: { updated, rename },
    } = state
    return {
        ...containerProps,
        isActive: state.hasFocus,
        nodes: ExplorerSelectors.mapStateToNodeList(state),
        updated,
        yanked,
        isCreating: state.register.create.active,
        isRenaming: rename.active && rename.target,
    }
}

export const Explorer = compose(connect(mapStateToProps), DND.DragDropContext(HTML5Backend))(
    ExplorerView,
)
