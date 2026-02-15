const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('lodash/')) {
    const subpath = moduleName.replace('lodash/', '');
    const resolved = path.join(__dirname, 'node_modules', 'lodash', `${subpath}.js`);
    if (fs.existsSync(resolved)) {
      return { type: 'sourceFile', filePath: resolved };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
