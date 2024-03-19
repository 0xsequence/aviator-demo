const path = require('path');
const pkg = require('./package.json');
const { ENV } = require('./env.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
const buildPath = './build/';
const webpack = require('webpack');

console.log(process.env)

module.exports = {
  entry: ['./src/entry.js'],
  output: {
    path: path.join(__dirname, buildPath),
    filename: '[name].[hash].js',
  },
  mode: 'development',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$|jsx/,
        use: 'babel-loader',
        exclude: path.resolve(__dirname, './node_modules/'),
      },
      {
        test: /\.(jpe?g|png|gif|svg|tga|glb|babylon|mtl|pcb|pcd|prwm|obj|mat|mp3|ogg)$/i,
        type: 'asset/resource',
        exclude: path.resolve(__dirname, './node_modules/'),
        generator: {
          filename: 'assets/[name].[ext]',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new HtmlWebpackPlugin({
      title: 'Aviator Sequence Demo',
      template: './src/index.html',
    }),
    new webpack.DefinePlugin({
      ENV: true
        ? JSON.stringify({
            appleClientId: 'app.sequence.aviator',
            projectAccessKeyProd: 'QymuJkTf4nZUoMTWRo3qyUPAAAAAAAAAA',
            projectAccessKey: process.env.projectAccessKey,
            waasConfigKey: process.env.waasConfigKey,
            walletConnectId: process.env.walletConnectId,
            googleClientId: process.env.googleClientId,
          })
        : JSON.stringify(ENV),
    }),
  ],
  resolve: {
    fallback: {
      // other fallbacks...
      buffer: require.resolve('buffer/'),
    },
  },
};
