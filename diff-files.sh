#!/bin/bash

# echo "folder prefix: $1"
CHANGED_FILES=$(git diff --name-only HEAD^ HEAD | grep ^$1\/ -c)
echo $CHANGED_FILES;


# if [[ $CHANGED_FILES > 0 ]]; then
#   echo "something changed: $CHANGED_FILES"
# else
#   echo "nothing changed: $CHANGED_FILES"
# fi

# echo "done"