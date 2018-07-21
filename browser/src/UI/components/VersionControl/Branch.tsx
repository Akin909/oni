import * as React from "react"

import { Diff } from "./../../../Services/VersionControl"
import styled, { IThemeColors, withProps } from "./../../../UI/components/common"
import Octicon from "./Octicon"

type ChangeTypes = "change" | "addition" | "deletion"

interface ICreateIconArgs {
    name: string
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
    diff: Diff
}

export const Branch: React.SFC<BranchProps> = ({ diff, branch, children }) =>
    branch && (
        <BranchContainer>
            <BranchText>
                <Octicon name="git-branch" />
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

interface ChangesProps {
    deletions: number
    insertions: number
}

export const DeletionsAndInsertions: React.SFC<ChangesProps> = ({ deletions, insertions }) => (
    <span>
        <VCSIcon name="diff-added" type="addition" num={insertions} />
        {!!(deletions && insertions) && <span key={2}>, </span>}
        <VCSIcon name="diff-removed" type="deletion" num={deletions} />
    </span>
)

export const VCSIcon: React.SFC<ICreateIconArgs> = ({ type, name, num }) =>
    !!num && (
        <span>
            <ChangeSpanContainer type={type}>
                <Octicon name={name} />
            </ChangeSpanContainer>
            <ChangeSpan data-test={`${type}-${num}`}>{num}</ChangeSpan>
        </span>
    )
