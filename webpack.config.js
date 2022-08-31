const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const htmlWebpackPlugin = new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'example/src/index.html'),
    filename: './index.html',
    favicon: './example/src/favicon.ico',
});

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'example/src/index.js'),
    output: {
        path: path.resolve(__dirname, "example/dist"),
        filename: "bundle.js"
    },
    plugins: [htmlWebpackPlugin],
    resolve: {
        extensions: [".js", ".jsx"]
    },
    devServer: {
        port: 3001
    }
};
