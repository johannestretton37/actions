#!/bin/bash

REGEX_STR=""
while getopts ":p::" arg; do
  case "${arg}" in
    p)
      if [[ $OPTIND > 3 ]]; then
        REGEX_STR+="|"
      fi
      REGEX_STR+="^$(echo $OPTARG | sed -E 's/.?\///')\/"
      ;;
  esac
done
echo $REGEX_STR;

echo "CHANGED_FILES=$(git diff --name-only HEAD^ HEAD | egrep $REGEX_STR -c)"; # >> $GITHUB_ENV;