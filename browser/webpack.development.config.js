var path = require("path")
var webpack = require("webpack")

const createStyledComponentsTransformer = require("typescript-plugin-styled-components").default
const styledComponentsTransformer = createStyledComponentsTransformer()

module.exports = {
    mode: "development",
    entry: [path.join(__dirname, "src/index.tsx")],
    target: "electron-renderer",
    externals: {
        "vscode-jsonrpc": "require('vscode-jsonrpc')",
        "vscode-textmate": "require('vscode-textmate')",
        "vscode-languageserver-types": "require('vscode-languageserver-types')",
        "keyboard-layout": "require('keyboard-layout')",
        gifshot: "require('gifshot')",
        "msgpack-lite": "require('msgpack-lite')",
        "simple-git/promise": "require('simple-git/promise')",
        "styled-components": "require('styled-components')",
        fsevents: "require('fsevents')",
        "font-manager": "require('font-manager')",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".less"],
    },
    module: {
        rules: [
            {
                test: /\.(html)$/,
                use: {
                    loader: "html-loader",
                },
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: "style-loader", // creates style nodes from JS strings
                    },
                    {
                        loader: "css-loader", // translates CSS into CommonJS
                    },
                    {
                        loader: "less-loader", // compiles Less to CSS
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
                exclude: /node_modules/,
            },
            { test: /\.worker\.ts$/, loader: "worker-loader" },
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        getCustomTransformers: () => ({ before: [styledComponentsTransformer] }),
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": '"development"',
        }),
    ],
    output: {
        path: path.join(__dirname, "..", "lib", "browser"),
        publicPath: "http://localhost:8191/",
        filename: "bundle.js",
        chunkFilename: "[name].bundle.js",
        globalObject: "this",
    },
    node: {
        process: false,
        __dirname: false,
    },
}
