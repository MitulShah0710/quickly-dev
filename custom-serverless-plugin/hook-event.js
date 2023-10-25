const fs = require('fs');
const fse = require('fs-extra');
class MyPlugin {
  constructor(serverless) {
    this.serverless = serverless
    this.hooks = {
      'initialize': () => this.init(),
      'before:package:package': () => this.beforePackage(),
      'after:deploy:deploy': () => this.afterDeploy(),
    };
  }

  init() {
    console.log('-- updating API key expiration before packaging!')
    fs.writeFileSync('./build-data.json', JSON.stringify({ apiKeyExpiry: parseInt(new Date().getTime() / 1000) + (86400 * 365) }))

    // Copy the 3rd party node_modules to Static Layer
    // console.log('-- copying the node_modules to static layer');
    // fse.removeSync('./layers/static-layer/nodejs/node_modules');    
    // fse.copySync('./node_modules', './layers/static-layer/nodejs/node_modules', { overwrite: true }, (err) => {
    //   if(err) console.log(err);
    //   if(!err) console.log('node_modules copied to the static layer');
    // });
    // fse.removeSync('./layers/static-layer/nodejs/node_modules/aws-sdk');
    // fse.removeSync('./layers/static-layer/nodejs/node_modules/@aws-sdk');
    // fse.removeSync('./layers/static-layer/nodejs/node_modules/typescript');
  }

  // This is to ensure that we move the requires packages at the right place to build the latest Layer
  beforePackage() {
    // Copy the node_modules to layer/static-layer/nodejs/node_modules
    // Remove the aws-sdk from the layer/static-layer/nodejs/node_modules    
    
  }

  afterDeploy() {
    console.log('Stack is deployed!')
    // const service = this.serverless.service
    // console.log('provider', service.resources)    
  }
}

module.exports = MyPlugin;