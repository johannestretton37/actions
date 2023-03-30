#!/bin/bash

DICT=$(cat)

export URL_DEV_SE=$(echo $DICT | jq -r '.dev.se');
export URL_DEV_NO=$(echo $DICT | jq -r '.dev.no');
export URL_DEV_DK=$(echo $DICT | jq -r '.dev.dk');
export URL_DEV_FI=$(echo $DICT | jq -r '.dev.fi');
export URL_PROD_SE=$(echo $DICT | jq -r '.prod.se');
export URL_PROD_NO=$(echo $DICT | jq -r '.prod.no');
export URL_PROD_DK=$(echo $DICT | jq -r '.prod.dk');
export URL_PROD_FI=$(echo $DICT | jq -r '.prod.fi');

envsubst < ./.github/templates/notify-teams-template.json