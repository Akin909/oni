import Octicon, { getIconByName } from "@githubprimer/octicons-react"
import * as React from "react"

interface IProps {
    name: string
}
/**
 * An Component which returns an octicon based on the name passed to it
 *
 * @name Icon
 * @function
 * @param {string} name the name of the octicon
 * @param {any} ...props Other props
 * @returns {JSX.Element} An Octicon component
 */
export default function Icon({ name, ...props }: IProps) {
    return <Octicon {...props} icon={getIconByName(name)} />
}
