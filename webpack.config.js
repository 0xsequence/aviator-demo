const path = require('path');
const pkg = require('./package.json');
const {ENV} = require('./env');
const HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
const buildPath = './build/';
const webpack = require('webpack');

module.exports = {
  entry: ['./src/entry.js'],
  output: {
    path: path.join(__dirname, buildPath),
    filename: '[name].[hash].js'
  },
  mode: 'development',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      },{
        test: /\.(jpe?g|png|gif|svg|tga|glb|babylon|mtl|pcb|pcd|prwm|obj|mat|mp3|ogg)$/i,
        type: 'asset/resource',
        exclude: path.resolve(__dirname, './node_modules/'),
        generator: {
          filename: 'assets/[name].[ext]'
        }
      },{
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
        exclude: path.resolve(__dirname, './node_modules/')
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      'title': 'Aviator Sequence Demo',
      'template': './src/index.html'
    }),
    new MiniCssExtractPlugin({
    }),
    new webpack.DefinePlugin({
      'ENV': JSON.stringify(ENV),
    }),
  ]
}
