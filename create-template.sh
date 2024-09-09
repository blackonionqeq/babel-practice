#!/usr/bin/env bash
if [ $! -eq 0 ]; then
  set -- new-template
fi

cp -r ./utils/template-project $1
# mkdir $1
# cd $1
# mkdir plugin
# cp ../3-auto-intl/sourceCode.js ./sourceCode.js
# cp ../2-add-import-and-call/plugin/_.mjs ./plugin/plugin.js
# cp ../3-auto-intl/index.mjs ./index.mjs
echo create success!

# cd ..
./add-template-debug-config.mjs $1

