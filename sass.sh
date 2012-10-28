#!/bin/bash

# remove all css files and recompile
rm -rf ./css/*.css

# make sass listen for changes to scss files
sass --watch ./css:./css
