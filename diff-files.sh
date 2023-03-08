#!/bin/bash

echo "CHANGED_FILES=$(git diff --name-only HEAD^ HEAD | grep ^$1\/ -c)" >> $GITHUB_ENV;