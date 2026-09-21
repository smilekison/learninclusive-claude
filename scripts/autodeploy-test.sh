#!/bin/sh
set -eu

printf '%s\n' '==> Installing dependencies'
npm ci

printf '%s\n' '==> Linting'
npm run lint

printf '%s\n' '==> Running tests'
npm test

printf '%s\n' '==> Building production bundle'
npm run build

printf '%s\n' '==> LearnInclusive pre-deploy checks passed'
