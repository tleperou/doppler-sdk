const typescript = require('rollup-plugin-typescript2');

module.exports = {
  rollup(config, options) {
    config.plugins = config.plugins.map(plugin => {
      if (plugin.name === 'rpt2') { // 'rpt2' is the internal name for rollup-plugin-typescript2
        return typescript({
          ...plugin.options,
          transpileOnly: true,
        });
      }
      return plugin;
    });
    return config;
  },
};