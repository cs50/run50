var ansispan = function (str) {
    var str = str.toString();
    
    // split by ansi reset sequences. if the last thing in the array does not
    // have an ansi tag, then this string is composed of valid ansi   
    var matches = str.split("\033\[0m");
 
    // turn the matches into their span tag formats 
    for (var i in matches) {
        // if a segment doesn't happen to have an ansi sequence (the last one)
        if (!matches[i].match(/\033\[[^m]*m/))
            matches[i] = "<span>" + matches[i];
        // else apply the styles to the ansi sequence
        else {
            matches[i] = matches[i].replace(/\033\[([^m]*)m/, function($1, $2) {
                var styles = $2.split(';');
                var span = '<span style="';
                for (var j in styles)
                    span += ansispan.styles[styles[j]] || "";
                span += '">';
                return span;
            });
        }
    }
    
    // insert the close span tags, handle the last match as well
    return matches.join('</span>') + '</span>';
};

// added method that checks if the ansispan format is valid
var validANSI = function(str) {
    // split by ansi reset sequences. if the last thing in the array does not
    // have a reset ansi tag, then this string is composed of valid ansi   
    var matches = str.split("\033\[0m");
    return !matches[matches.length - 1].match(/\033\[[^m]*m/);
}

ansispan.styles = {
  '30': 'color: black; ',
  '31': 'color: red; ',
  '32': 'color: green; ',
  '33': 'color: yellow; ',
  '35': 'color: purple; ',
  '36': 'color: cyan; ',
  '37': 'color: white; ',
  '1': 'font-weight: bold; ',
  '3': 'font-style: italic; ',
  '4': 'text-decoration: underline; '
};

if (typeof module == "object" && typeof window == "undefined") {
  module.exports = ansispan;
}

