const path = require('path');
const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

function cmakeArgsBlock(ninjaPath) {
  const makeProgram = ninjaPath.replace(/\\/g, '/');
  return `
        externalNativeBuild {
            cmake {
                arguments "-DCMAKE_MAKE_PROGRAM=${makeProgram}", "-DCMAKE_OBJECT_PATH_MAX=1024"
            }
        }`;
}

function subprojectsHook(ninjaPath) {
  const makeProgram = ninjaPath.replace(/\\/g, '/');
  return `

// Windows: use Ninja 1.12+ and longer object paths for CMake native builds
subprojects { subproject ->
    subproject.plugins.withId("com.android.library") {
        subproject.android.defaultConfig {
            externalNativeBuild {
                cmake {
                    arguments "-DCMAKE_MAKE_PROGRAM=${makeProgram}", "-DCMAKE_OBJECT_PATH_MAX=1024"
                }
            }
        }
    }
    subproject.plugins.withId("com.android.application") {
        subproject.android.defaultConfig {
            externalNativeBuild {
                cmake {
                    arguments "-DCMAKE_MAKE_PROGRAM=${makeProgram}", "-DCMAKE_OBJECT_PATH_MAX=1024"
                }
            }
        }
    }
}
`;
}

function withNinjaLongPaths(config) {
  // Only apply custom Ninja on Windows. Linux (EAS) already handles long paths
  // and has its own ninja installment. 
  if (process.platform !== 'win32') {
    return config;
  }

  const ninjaPath = path.join(__dirname, '..', 'tools', 'ninja.exe');

  config = withAppBuildGradle(config, (gradleConfig) => {
    if (!gradleConfig.modResults.contents.includes('DCMAKE_MAKE_PROGRAM')) {
      gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
        /(defaultConfig\s*\{[\s\S]*?)(\n    \})/,
        `$1${cmakeArgsBlock(ninjaPath)}$2`
      );
    }
    return gradleConfig;
  });

  return withProjectBuildGradle(config, (gradleConfig) => {
    if (!gradleConfig.modResults.contents.includes('DCMAKE_MAKE_PROGRAM')) {
      gradleConfig.modResults.contents += subprojectsHook(ninjaPath);
    }
    return gradleConfig;
  });
}

module.exports = withNinjaLongPaths;
