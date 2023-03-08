#!/bin/bash

# echo "CHANGED_FILES=$(git diff --name-only HEAD^ HEAD | grep ^$1\/ -c)" >> $GITHUB_ENV;

REGEX_STR=""
while getopts ":p::" arg; do
  case "${arg}" in
    p)
      if [[ $OPTIND > 3 ]]; then
        REGEX_STR+="|"
      fi
      REGEX_STR+="^$OPTARG\/"
      ;;
  esac
done

echo $REGEX_STR;
echo "CHANGED_FILES=$(git diff --name-only HEAD^ HEAD | grep $REGEX_STR -c)";
#  >> $GITHUB_ENV;