const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  entry: {
    background: './src/application/background/background.service.ts',
    content: './src/ui/content-scripts/main.ts', 
    popup: './src/ui/popup/main-popup.ts',
    options: './src/ui/options/options-page.ts'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true
  },
  
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
            transpileOnly: false, // Full type checking
            compilerOptions: {
              noEmitOnError: true // Fail build on TS errors
            }
          }
        }
      }
    ]
  },
  
  resolve: {
    extensions: ['.ts'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@ui': path.resolve(__dirname, 'src/ui')
    }
  },
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        shared: {
          name: 'shared',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        }
      }
    }
  },
  
  devtool: process.env.NODE_ENV === 'development' 
    ? 'cheap-module-source-map' 
    : 'source-map'
};
        