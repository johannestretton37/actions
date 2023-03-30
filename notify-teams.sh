#!/bin/bash

DICT=$(cat) \
URL_DEV_SE=$(echo "$DICT" | jq '.dev.se') \
URL_DEV_NO=$(echo "$DICT" | jq '.dev.no') \
URL_DEV_DK=$(echo "$DICT" | jq '.dev.dk') \
URL_DEV_FI=$(echo "$DICT" | jq '.dev.fi') \
URL_PROD_SE=$(echo "$DICT" | jq '.prod.se') \
URL_PROD_NO=$(echo "$DICT" | jq '.prod.no') \
URL_PROD_DK=$(echo "$DICT" | jq '.prod.dk') \
URL_PROD_FI=$(echo "$DICT" | jq '.prod.fi') \
envsubst < ./template.json