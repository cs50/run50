echo "Building Check JavaScript..."
cat \
    js/lib/underscore-min.js \
    js/cs50.check.js \
    js/lib/ansispan/ansispan.js \
    > build/cs50.check.min.js
java -jar yuicompressor-2.4.7.jar -o build/cs50.check.min.js build/cs50.check.min.js

echo "Building Check CSS..."
cat \
    css/cs50.check.css \
    > build/cs50.check.min.css
java -jar yuicompressor-2.4.7.jar -o build/cs50.check.min.css build/cs50.check.min.css
