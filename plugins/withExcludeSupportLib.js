const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Excludes the entire legacy com.android.support group, which some native
 * modules (e.g. speech-recognition libraries) still pull in transitively.
 * These collide with their androidx equivalents and cause "duplicate class"
 * and "duplicate resource" build failures. AndroidX fully replaces this
 * group, so excluding it wholesale is safe.
 */
module.exports = function withExcludeSupportLib(config) {
  return withAppBuildGradle(config, (config) => {
    const exclusionBlock = `
configurations.all {
    exclude group: 'com.android.support'
}

android {
    packagingOptions {
        resources {
            pickFirsts += ['META-INF/*.version']
        }
    }
}
`;

    if (!config.modResults.contents.includes("exclude group: 'com.android.support'")) {
      config.modResults.contents += exclusionBlock;
    }

    return config;
  });
};