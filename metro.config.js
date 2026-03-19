const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable minification and obfuscation for production
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierPath = 'metro-minify-terser';
  config.transformer.minifierConfig = {
    // Terser options
    compress: {
      drop_console: true,
    },
    mangle: {
      toplevel: true,
    },
  };
}

module.exports = withNativeWind(config, { input: './app/global.css' });