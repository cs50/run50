$(function() {
    // take input file
    var inlines = "joseph1 \n\
joseph2 \n\
joseph3 \n\
joseph4 \n\
joseph5 \n\
joseph6 \n\
joseph7"
    
    // take diff file
    var diffs = "1,7c \n\
martin1 \n\
martin2 \n\
martin3 \n\
martin4 \n\
martin5 \n\
martin6 \n\
martin7 \n\
martin8 \n\
.";

    var outlines = inlines;

    // convert each into arrays
    var inlines = inlines.split("\n");
    var outlines = outlines.split("\n");

    // ignore whitespace at end for diffs
    var diffs = diffs.split(".");

    _.each(diffs, function(diff) {
        // split diff on new lines to separate operation type and content, ignore last newline
        diff = diff.split("\n");
        diff.splice(-1);

        // remember, arrays are passed by reference, so this mutates inlines/outlines
        // apply the operation based on what it is (insert, change, append)
        if (diff.length > 0) {
            switch(diff[0].charAt(diff[0].search(/[acd]/))) {
                // rule asks to append lines
                case 'a':
                    applyAppend(inlines, outlines, diff); 
                    break;
                // rule asks to delete lines
                case 'd':
                    applyDelete(outlines, diff);
                    break;
                // rule to interchange lines
                case 'c':
                    applyChange(inlines, outlines, diff);
                    break;
            }
        }
    });
});

// rule of form 5a, content on newlines thereafter, where 5 is 0-index of where to start appending.
// i.e. 0a means insert these lines before ALL lines in the document.
var applyAppend = function(inlines, outlines, diff) {
    // first, figure out where to start appending
    var start = parseInt(diff[0].slice(0, diff[0].indexOf("a")));
    
    // append blank lines to inlines
    for (var i = 0; i < diff.length - 1; i++)
        inlines.splice(start, 0, "");

    // add lines be appended to our outlines, ignoring diff's first line
    // TODO: actually append lines
    outlines.splice(parseInt(start), 0, diff.slice(1));
}

// rule of form 1,2d, deletion of lines 1 to 2, inclusive, 1-indexed.
// i.e. 1,5d means delete the first five lines of the document -- NOT 0,4d.
var applyDelete = function(outlines, diff) {
    // first, figure out the boundaries of the deletion
    var boundaries = diff[0].slice(0, diff[0].indexOf("d")).split(',');

    // append blank lines to the outlines, accounting for 1 indexing
    for (var i = boundaries[0]; i <= boundaries[i]; i++) 
        inlines.splice(boundaries[0] - 1, 0, ""); 
}

// rule of form 1,5c, means change lines 1-5, inclusive, 1-indexed.
// the content inserted may exceed the number of lines replaced
var applyChange = function(inlines, outlines, diff) {
    // first, figure out the boundaries of the change, and insertion length
    var boundaries = diff[0].slice(0, diff[0].indexOf("c")).split(',');

    // determine the line difference after appending text
    var delta = (diff.length - 1) - (boundaries[1] - boundaries[0] + 1);

    // if delta is negative, losing lines, so add space to outlines
    if (delta < 0) {
        for (var i = delta; i < 0; i++)
            outlines.splice(boundaries[0] - 1, 0, "");
    } else if (delta > 0) {
        // if delta positive, adding lines, so add spaces to inlines
        for (var i = delta; i > 0; i--) 
            inlines.splice(boundaries[1], 0, "");
    }

    // delete lines from outlines
    outlines.splice(boundaries[0] - 1, (boundaries[1] - boundaries[0] + 1));
    
    // append new line content to the outlines
    for (var i = diff.length - 1; i > 0; i--) {
        outlines.splice(boundaries[0] - 1, 0, diff[i]); 
    }
    // rejoin inlines and outlines with newlines, and log output
    console.log(inlines.join("\n"));
    console.log(outlines.join("\n"));
}


