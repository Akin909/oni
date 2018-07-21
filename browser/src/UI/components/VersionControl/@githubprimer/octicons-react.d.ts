import { SFC } from "react"

declare module "@githubprimer/octicons-react" {
    type Size = "small" | "medium" | "large"
    interface OcticonProps {
        ariaLabel?: string
        children?: React.ReactElement<any>
        height?: number
        icon: any
        size?: number | Size
        verticalAlign?: "middle" | "text-bottom" | "text-top" | "top"
        width?: number
    }
    declare const Octicon: SFC<OcticonProps>
    export default Octicon
}
