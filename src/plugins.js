// const { createExtension, registerTargets, traceHook } = require('@forrestjs/core');

// var { config, addConvict } = require("./ConfigManager");
// const { newType, addLED } = require("./LEDManager");
// const plugins = {};

// config.get().components.plugins.forEach(function(plugin) {
//     plugins[plugin] = require(plugin);
//     // if (typeof plugin.init !== 'function') return;
//     console.log('loading plugin %s on app', plugin);
    
//     plugins[plugin].init({
//         Name: plugin,
//         newType, addLED
//     });
// });


// // console.log(plugins)
// Object.keys(plugins).forEach(function(plugin) {
//     plugins[plugin].registerConfig({
//         Name: plugin,
//         addConvict: ((Schema, Name = "global") => {
//             addConvict(plugin, Schema, Name = "global");
//         }),
//     });
// });



// module.exports = {
//     plugins
// }