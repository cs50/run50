#!/bin/sh

rm -rf build
mkdir -p build/img

echo "Building JavaScript..."
java -jar yuicompressor-2.4.7.jar -o build/cs50.run.min.js \
    js/lib/jquery-ui-1.8.21.custom.min.js \
    js/lib/socket.io.min.js \
    js/lib/underscore-min.js \
    js/lib/ansispan/ansispan.js \
    js/lib/chosen/chosen.jquery.min.js \
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
    js/cs50.run.js

echo "Building CSS..."
java -jar yuicompressor-2.4.7.jar -o build/cs50.run.min.css \
    css/lib/jquery-ui-1.8.21.custom.css \
    css/lib/codemirror.css \
    css/lib/codemirror-dialog.css \
    css/lib/chosen/chosen.css \
    css/cs50.run.css

echo "Copying images..."
cp css/img/* build/img
cp css/lib/img/* build/img
