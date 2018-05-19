import * as React from "react"

import { Diff } from "./../../Services/VersionControl"
import styled, { IThemeColors, withProps } from "./../../UI/components/common"
import { Icon } from "./../../UI/Icon"

type ChangeTypes = "change" | "addition" | "deletion"

interface ICreateIconArgs {
    type: ChangeTypes
    num: number
}

const BranchContainer = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
`

const BranchText = styled.span`
    min-width: 10px;
    text-align: center;
    padding: 2px 4px 0 0;
    display: flex;
    align-items: center;
`

export const BranchNameContainer = styled.span`
    width: 100%;
    margin-left: 4px;
`

const selectColorByType = (type: ChangeTypes, theme: IThemeColors) => {
    switch (type) {
        case "addition":
        case "deletion":
        case "change":
        default:
            return ""
    }
}

const ChangeSpanContainer = withProps<{ type: ChangeTypes }>(styled.span)`
    font-size: 0.7rem;
    padding: 0 0.15rem;
    color: ${({ type, theme }) => selectColorByType(type, theme)};
`

const ChangeSpan = styled.span`
    padding-left: 0.25rem;
`

interface BranchProps {
    branch: string
    children?: React.ReactNode
    diff: Diff | void
}

export const Branch = ({ diff, branch, children }: BranchProps) => (
    <BranchContainer>
        <BranchText>
            <Icon name="code-fork" />
            <BranchNameContainer>
                {`${branch} `}
                {diff && (
                    <DeletionsAndInsertions
                        deletions={diff.deletions}
                        insertions={diff.insertions}
                    />
                )}
                {children}
            </BranchNameContainer>
        </BranchText>
    </BranchContainer>
)

const getClassNameForType = (type: ChangeTypes) => {
    switch (type) {
        case "addition":
            return "plus-circle"
        case "deletion":
            return "minus-circle"
        case "change":
        default:
            return "question-circle"
    }
}

interface ChangesProps {
    deletions: number
    insertions: number
}

export const DeletionsAndInsertions = ({ deletions, insertions }: ChangesProps) => (
    <span>
        <VCSIcon type="addition" num={insertions} />
        {!!(deletions && insertions) && <span key={2}>, </span>}
        <VCSIcon type="deletion" num={deletions} />
    </span>
)

export const VCSIcon = ({ type, num }: ICreateIconArgs) =>
    !!num && (
        <span>
            <ChangeSpanContainer type={type}>
                <Icon name={getClassNameForType(type)} />
            </ChangeSpanContainer>
            <ChangeSpan data-test={`${type}-${num}`}>{num}</ChangeSpan>
        </span>
    )