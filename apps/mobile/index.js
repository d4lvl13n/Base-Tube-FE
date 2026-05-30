// Local entry point. In a monorepo with hoisted node_modules, pointing
// package.json "main" directly at "expo-router/entry" makes the web bundler
// emit an invalid "/../../node_modules/..." bundle URL. Re-exporting from a
// project-local file keeps the bundle path project-relative.
import 'expo-router/entry';
