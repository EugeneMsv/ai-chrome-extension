const path = require('path');

module.exports = {
  mode: 'development', // or 'production' for optimized builds
  entry: {
    // If you rename background.js to background.ts, update the entry point:
    content: './content/main.js', // Assuming content script remains JS for now, or convert it too
    background: './background/background.ts' // Entry point for your background script
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Look for .ts and .tsx files
        use: 'ts-loader', // Use ts-loader for them
        exclude: /node_modules/,
      },
      {
        test: /\.js$/, // Existing rule for JS files (if any remain or for other parts)
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
  resolve: {
    extensions: ['.tsx', '.ts', '.js'], // Add .ts and .tsx to resolvable extensions
    // Optional: if you defined paths in tsconfig.json, you might need to alias them here too
    // alias: {
    //   "@background": path.resolve(__dirname, 'background/'),
    // }
  },
  devtool: 'cheap-module-source-map'
};