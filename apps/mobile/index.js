// Native polyfills must load before ANY route module (Expo Router evaluates
// route files — which import Clerk — before app/_layout runs), so they live
// here at the true entry, ahead of the expo-router/entry re-export below.
// Order matters: the import-free SharedArrayBuffer shim first, THEN the URL
// polyfill (which provides global URL/URLSearchParams), THEN the router.
import './src/polyfills';
import 'react-native-url-polyfill/auto';

// Local entry point. In a monorepo with hoisted node_modules, pointing
// package.json "main" directly at "expo-router/entry" makes the web bundler
// emit an invalid "/../../node_modules/..." bundle URL. Re-exporting from a
// project-local file keeps the bundle path project-relative.
import 'expo-router/entry';
