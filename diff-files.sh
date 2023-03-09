#!/bin/bash

REGEX_STR=""
OLD_COMMIT="HEAD^"

while getopts ":p::c::" arg; do
  case "${arg}" in
    p)
      if [[ $OPTIND > 3 ]]; then
        REGEX_STR+="|"
      fi
      REGEX_STR+="^$(echo $OPTARG | sed -E 's/.?\///')\/"
      ;;
    c)
      OLD_COMMIT="$OPTARG^"
      ;;
  esac
done
echo $REGEX_STR;

NEW_COMMIT=HEAD

echo "git diff --name-only $OLD_COMMIT..$NEW_COMMIT | egrep $REGEX_STR -c"
echo -e "\n------ CHANGED FILES: ------"
git diff --name-only $OLD_COMMIT..$NEW_COMMIT | egrep $REGEX_STR;
echo -e "----------- END ------------\n"
echo "CHANGED_FILES=$(git diff --name-only $OLD_COMMIT..$NEW_COMMIT | egrep $REGEX_STR -c)"; # >> $GITHUB_ENV;