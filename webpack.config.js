const path = require('path');

module.exports = {
  mode: 'development', // or 'production' for optimized builds
  entry: {
    content: './content/main.js', // Entry point for your content script
    background: './background/background.js' // Entry point for your background script
  },
  output: {
    filename: '[name].bundle.js', // Output file name
    path: path.resolve(__dirname, 'dist'), // Output directory
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
devtool: 'cheap-module-source-map' // Add this line

};
        