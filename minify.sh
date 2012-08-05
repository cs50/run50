#!/bin/sh

rm -rf build
mkdir -p build/img

echo "Building JavaScript..."
cat \
    js/lib/jquery-ui-1.8.21.custom.min.js \
    js/lib/underscore-min.js \
    js/lib/date.js \
    js/lib/codemirror/codemirror.js \
    js/lib/codemirror/formatting.js \
    js/lib/codemirror/dialog.js \
    js/lib/codemirror/searchcursor.js \
    js/lib/codemirror/clike.js \
    js/lib/codemirror/css.js \
    js/lib/codemirror/javascript.js \
    js/lib/codemirror/php.js \
    js/lib/codemirror/ruby.js \
    js/lib/codemirror/htmlmixed.js \
    js/lib/codemirror/mysql.js \
    js/lib/codemirror/python.js \
    js/lib/codemirror/search.js \
    js/lib/codemirror/xml.js \
    js/lib/socket.io.min.js \
    js/lib/ansispan/ansispan.js \
    js/cs50.run.js \
    > build/cs50.run.min.js
java -jar yuicompressor-2.4.7.jar -o build/cs50.run.min.js build/cs50.run.min.js

echo "Building CSS..."
cat \
    css/lib/jquery-ui-1.8.21.custom.css \
    css/lib/codemirror.css \
    css/lib/codemirror-dialog.css \
    css/cs50.run.css \
    > build/cs50.run.min.css
java -jar yuicompressor-2.4.7.jar -o build/cs50.run.min.css build/cs50.run.min.css

echo "Copying images..."
cp css/img/* build/img
cp css/lib/img/* build/img
