export type PopupItem = [string /*word*/, string /*kind*/, string /*menu*/, string /*info*/]
export type PopupShow = [
    "popupmenu_show",
    PopupItem[],
    number /* selected */,
    number /* row */,
    number /* col */
]
export type PopupHide = ["popupmenu_hide"]
export type PopupSelect = ["popupmenu_select", number]
export type GridResize = ["grid_resize", number, number, number]
export type DefaultColorsSet = ["default_colors_set", number, number, number, number, number]
export type HLAttrDefine = [
    "hl_attr_define",
    number /* id */,
    string /* rgb_attr */,
    string /* cterm_attr */,
    string /*info */
]
export type Cell = [string /* text */, number /* highlightId */, boolean /* repeat */]
export type Cells = Cell[][]
export type GridLine = [
    "grid_line",
    number /*  grid */,
    number /*  row */,
    number /* col_start */,
    Cells
]
export type GridClear = ["grid_clear", number]
export type GridDestroy = ["grid_destroy", number]
export type GridCursorGoto = [
    "grid_cursor_goto",
    number /*  grid */,
    number /*  row */,
    number /*  column */
]
export type GridScroll = [
    "grid_scroll",
    number /*grid*/,
    number /* top */,
    number /*  bot */,
    number /*  left */,
    number /* right */,
    number /* rows */,
    number /* cols */
]
interface ITabpage {
    name: string
    tab: number
}
export type TablineUpdate = ["tabline_update", number /* curtab */, ITabpage[]]
export type CommandLineShow = [
    "cmdline_show",
    string /* content */,
    number /* pos */,
    string /* firstc */,
    string /* prompt */,
    number /* indent */,
    number /* level */
]
export type CommandLinePos = ["cmdline_pos", number /* pos */, number /* level */]
export type CommandLineHide = ["cmdline_hide"]
export type WildMenuShow = ["wildmenu_show", string[] /* items */]
export type WildMenuSelect = ["wildmenu_select", number /* selected */]
export type WildMenuHide = ["wildmenu_hide"]
export type MouseOn = ["mouse_on"]
export type MouseOff = ["mouse_off"]
export type BusyStart = ["busy_start"]
export type BusyStop = ["busy_stop"]
export type Bell = ["bell"]
export type VisualBell = ["visual_bell"]
export type Flush = ["flush"]
export type ModeChange = ["mode_change", string /* mode */, number /* mode_idx */]
type Option =
    | "arabicshape"
    | "ambiwidth"
    | "emoji"
    | "guifont"
    | "guifontset"
    | "guifontwide"
    | "linespace"
    | "showtabline"
    | "termguicolors"
export type OptionSet = ["option_set", Option /* name */, string /* value */]
export type SetTitle = ["set_title", string /* title */]
export type SetIcon = ["set_icon", string /* icon */]
interface IModeInfo {
    cursor_shape: "block" | "horizontal" | "vertical"
    cell_percentage: number
    blinkwait: "blinkon" | "blinkoff"
    attr_id: string
    attr_id_lm: string
    short_name: string
    name: string
    mouse_shape: any
}
export type ModeInfoSet = [
    "mode_info_set",
    boolean /* cursor_style_enabled */,
    IModeInfo[] /* mode_info */
]
// export type UntypedEvent = [string, any, any, any]

export type NeovimEvents =
    | GridResize
    | DefaultColorsSet
    | HLAttrDefine
    | GridLine
    | GridClear
    | GridDestroy
    | GridCursorGoto
    | GridScroll
    | PopupShow
    | PopupSelect
    | PopupHide
    | TablineUpdate
    | CommandLineShow
    | CommandLinePos
    | CommandLineHide
    | WildMenuSelect
    | WildMenuShow
    | WildMenuHide
    | MouseOn
    | MouseOff
    | Bell
    | VisualBell
    | Flush
    | ModeChange
    | SetIcon
    | SetTitle
    | BusyStart
    | BusyStop
    | ModeInfoSet
