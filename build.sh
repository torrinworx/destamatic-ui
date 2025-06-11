#!/bin/bash
set -e
rm -rf dist
mkdir -p dist
mkdir -p dist/components
mkdir -p dist/util
cp README.md dist/
cp LICENSE dist/
cp index.js dist/
cp -r components/ dist/components/
cp -r util/ dist/util/

jq 'del(.scripts, .devDependencies) 
    | .module = "index.js" 
    | .exports = {".": {import: "./index.js"}}' package.json > dist/package.json

echo "Build finished."
