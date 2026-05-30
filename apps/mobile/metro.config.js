// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo so changes to @basetube/api are picked up.
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from the app first, then the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Prevent Metro from walking up and resolving duplicate React copies.
config.resolver.disableHierarchicalLookup = true;

// 4. Honour package "exports" maps + the `react-native` condition. Required so
//    modern dual-build packages (e.g. @clerk/clerk-expo, @clerk/shared) resolve
//    to their NATIVE build, not the browser bundle — the browser build references
//    SharedArrayBuffer / web URLSearchParams / document and crashes Hermes.
//    Default-on in Expo SDK 53+; must be enabled explicitly on SDK 51.
config.resolver.unstable_enablePackageExports = true;
// Prefer the `react-native` export condition so Clerk resolves to its native
// build (not the browser bundle). axios has no react-native condition and would
// fall to its Node build — handled by the explicit redirect in #5 below.
config.resolver.unstable_conditionNames = ['react-native', 'require', 'import'];

// 5. Redirect axios to its browser (XHR) build. With package exports enabled
//    (needed for #4), axios's native condition set otherwise resolves to its
//    Node build, which imports the Node `url` stdlib (absent in React Native).
//    The browser build uses XMLHttpRequest, which RN provides.
const axiosBrowser = path.resolve(workspaceRoot, 'node_modules/axios/dist/browser/axios.cjs');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios') {
    return { type: 'sourceFile', filePath: axiosBrowser };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
