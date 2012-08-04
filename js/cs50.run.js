// maintain compatibility with other CS50 libraries
var CS50 = CS50 || {};

/**
 * CS50 Run constructor
 *
 * @param options Editor options:
 *      container: DOM element into which editor will be loaded
 *      defaultLanguage: Language to start the editor off in (C, Java, PHP, Python, Ruby)
 *      endpoint: URL of CS50 Run's server
 *      languages: Languages user can choose from (C, Java, PHP, Python, Ruby)
 *
 */
CS50.Run = function(options) {
    this.options = options;

    // make sure default options are defined
    if (!this.options.container)
        throw 'Error: You must define a container for run50!';

    // default options
    this.options.defaultLanguage = (options.defaultLanguage === undefined) ? 'C' : options.defaultLanguage;
    this.options.endpoint = (options.endpoint === undefined) ? 'http://run.cs50.net:80' : options.endpoint.replace(/\/+$/, '');
    this.options.languages = (options.languages === undefined) ? ['C', 'Java', 'PHP', 'Python', 'Ruby'] : options.languages;
    this.options.prompt = (options.prompt === undefined) ? 'jharvard@run.cs50.net (~):' : options.prompt;

    // ensure endpoint specifies a port (else socket.io assumes server is on same port as client, even if on different host)
    if (!this.options.endpoint.match(/:\d+$/)) {
        this.options.endpoint += ':80';
    }

    // map from mimes to commands necessary to run code
    this.commands = {
        'text/x-csrc': [
            { command: 'clang file.c', args: '-std=c99 -Wall -Werror -fno-color-diagnostics -lcs50 -lm' },
            { command: './a.out', args: '' }
        ],

        'text/x-java': [
            { command: 'javac -J-Xmx128M file.java', args: '' },
            { command: 'java -Xmx64M', args: 'Class' }
        ],

        'text/x-php': [
            { command: 'php file.php', args: '' }
        ],

        'text/x-python': [
            { command: 'python file.py', args: '' }
        ],

        'text/x-ruby': [
            { command: 'ruby file.rb', args: '' }
        ]
    };

    // map from mimes to extensions
    this.extensions = {
        'text/x-csrc': 'c',
        'text/x-java': 'java',
        'text/x-php': 'php',
        'text/x-python': 'py',
        'text/x-ruby': 'rb'
    };

    // map from languages to mimes
    this.languageNames = {
        'C': 'text/x-csrc',
        'Java': 'text/x-java',
        'PHP': 'text/x-php',
        'Python': 'text/x-python',
        'Ruby': 'text/x-ruby'
    };

    // map from mimes to simple, runnable programs
    this.samples = {
        'text/x-csrc': '\
#include <cs50.h>\n\
#include <stdio.h>\n\
\n\
int main(int argc, char* argv[])\n\
{\n\
    printf("Enter your name: ");\n\
    string s = GetString();\n\
    printf("Hello, %s!\\n", s);\n\
    return 0;\n\
}\n',

        'text/x-java': 'class Main {\n\
    public static void main(String[] args) {\n\
        System.out.println("Hello, run50!");\n\
    }\n\
}\n',

        'text/x-php': '<?php\n\
\n\
echo "Hello, run50!\\n";\n\
\n\
?>\n',

        'text/x-python': 'print "Hello, run50!"',

        'text/x-ruby': 'puts "Hello, run50!"'
    };

    // define templates
    var templateHtml = {
        editor: ' \
            <div class="run50-container"> \
                <div class="run50-controls"> \
                    <button class="btn-run"> \
                       <div class="run-img"></div> \
                       <div class="paused-img"></div> \
                    </button> \
                    <div class="run50-lang-wrapper"> \
                        <select class="run50-lang chzn-select"> \
                            <% for (var i in languages) { %> \
                                <option value="<%= languageNames[languages[i]] %>"><%= languages[i] %></option> \
                            <% } %> \
                        </select>\
                    </div> \
                    <div class="btn-options"> \
                        <div class="gear-btn"></div> \
                    </div> \
                    <div class="run50-status"> \
                        <span class="status-text"></span> \
                        <img class="status-loader" src="css/img/ajax-bar.gif"/> \
                    </div> \
                    <div class="run50-options"></div> \
                </div> \
                <div class="run50-split-container"> \
                    <div class="run50-code-container"> \
                        <textarea class="run50-code"><%= samples[languageNames[defaultLanguage]] %></textarea> \
                    </div> \
                    <div class="run50-splitter">&equiv;&equiv;&equiv;</div> \
                    <div class="run50-console-container"> \
                        <pre class="run50-console"><div contenteditable="false" class="run50-input active"></div></pre> \
                    </div> \
                </div> \
            </div> \
        ',

        runOption: ' \
            <div data-id-command="<%= cmd.command %>" spellcheck="false"><%= cmd.command %></div> \
            <div type="text" contenteditable="true" spellcheck="false"><%= cmd.args %></div> \
            <div class="divider"></div> \
        '
    };

    // compile templates
    this.templates = {};
    for (var template in templateHtml)
        this.templates[template] = _.template(templateHtml[template]);

    this.createEditor();
};

/**
 * Create a new editor instance
 *
 */
CS50.Run.prototype.createEditor = function() {
    // add textarea to div
    var me = this;
    var $container = $(this.options.container);
    $container.html(this.templates.editor({
        defaultLanguage: this.options.defaultLanguage,
        languages: this.options.languages,
        languageNames: this.languageNames,
        samples: this.samples
    }));

    // create codemirror
    this.editor = CodeMirror.fromTextArea($container.find('.run50-code')[0], {
        indentUnit: 4,
        lineNumbers: true,
        lineWrapping: true
    });

    // reusable function for resizing the instance
    var resizeEditor = function() {
        // determine the dimensions of the plugin
        var height = $container.height();
        $container.find('.run50-controls, .run50-splitter, .run50-console-container').each(function(i, e) {
            height -= $(e).outerHeight();
        });
        var width = $container.width();

        // resize editor and console
        $container.find('.CodeMirror').width(width).height(height);
        $container.find('.CodeMirror-gutter, .CodeMirror-scrollbar, .CodeMirror-scroll').height(height);
        $container.find('.run50-container, .run50-controls, .run50-console-container, .run50-splitter').width(width);
    }
    resizeEditor();

    // event for updating dimensions
    $(window).on('resize', function() {
        resizeEditor();
    });

    // when run is clicked, run/stop the code
    $container.on('click', '.btn-run', function() {
        // server is currently running, so stop
        if ($(this).hasClass('running')) {
            me.socket.emit('SIGINT');
            $container.find('.run50-input.active').after('^C\n');        
        }
        // else, it was the play button, so trigger uploading
        // NOTE: upload cancelling is handled down in upload() since we need
        // a reference to the xhr object
        else if (!$(this).hasClass('uploading')) {
            $(this).addClass('uploading');
            $('.run50-status .status-loader').fadeIn(); 
            $('.run50-controls').removeClass('.success, .error');
            me.run();
        }
    });

    // catch ctrl-c and ctrl-d inside input
    $container.on('keyup', '.run50-input', function(e) {
        if (e.ctrlKey) {
            // ctrl-c, inserts a newline
            if (e.which == 67) {
                me.socket.emit('SIGINT');
                $container.find('.run50-input.active').after('^C\n');        
            }
            else if (e.which == 68)
                me.socket.emit('EOF');
        }
    });

    // when language is changed, load relevant mode file
    $container.on('change', '.run50-lang', function() {
        me.setLanguage($(this).val());
    });
    $container.find('.run50-lang').val(this.languageNames[this.options.defaultLanguage]).chosen().trigger('change');

    // when options is moused over, display run options
    $container.on('click', '.btn-options', function() {
        $options = $container.find('.run50-options');
    
        // taken from SO: http://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
        function placeCaretAtEnd(el) {
            el.focus();
            if (typeof window.getSelection != "undefined"
                    && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (typeof document.body.createTextRange != "undefined") {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(el);
                textRange.collapse(false);
                textRange.select();
            }
        }

        var height = $container.find('.run50-options').height();

        if ($options.is(":visible")) {
            $container.find('.run50-options').slideUp(150);
            $container.find('.CodeMirror').animate({
                height: "+=" + height
            }, 150);
            $container.find('.CodeMirror-gutter, .CodeMirror-scrollbar, .CodeMirror-scroll').animate({
                height: "+=" + height
            }, 150);
            $container.find('.btn-options').removeClass('active');
        }
        else {  
            $container.find('.run50-options').slideDown(150, function() {
                placeCaretAtEnd($(this).find('[contenteditable]').first()[0]);
            })
            $container.find('.CodeMirror').animate({
                height: "-=" + height
            }, 150);
            $container.find('.CodeMirror-gutter, .CodeMirror-scrollbar, .CodeMirror-scroll').animate({
                height: "-=" + height
            }, 150);
            $container.find('.btn-options').addClass('active');
        }
    });

    // prevent enter from being pressed in options dropdown
    $container.on('keydown', '.run50-options div', function(e) {
        if (e.which == 13) {
            e.preventDefault();
            return false;
        }
    });

    // create splitter
    var editorHeight = 0;
    var consoleHeight = 0;
    $container.find('.run50-splitter').draggable({ 
        axis: 'y',

        drag: function(event, ui) {
            // calculate new panel sizes
            var newEditorHeight = editorHeight + ui.position.top;
            var newConsoleHeight = consoleHeight - ui.position.top;

            // enforce minimum size on elements
            if (newEditorHeight > 100 && newConsoleHeight > 50) {
                // resize editor and console
                $container.find('.CodeMirror, .CodeMirror-gutter, .CodeMirror-scrollbar, .CodeMirror-scroll')
                    .height(editorHeight + ui.position.top);
                $container.find('.run50-console-container').height(consoleHeight - ui.position.top);
            }

            else
                return false;
        },
        
        start: function(event, ui) {
            editorHeight = $container.find('.CodeMirror').height();
            consoleHeight = $container.find('.run50-console-container').height();
        }
    });

    // when input is blurred, update args
    $container.on('blur', '.run50-options [contenteditable]', function() {
        // determine which text input was changed
        var t = this;
        $container.find('.run50-options [contenteditable]').each(function(i, e) {
            // update args value for the input
            if (t == this)
                me.commands[me.language][i].args = $(this).text();
        });
    });

    // when console is clicked, focus the editor
    $container.on('click', '.run50-console', function() {
        $(this).find('.run50-input').focus();
    });

    // when enter is pressed in the console, send to stdin
    $container.on('keypress', '.run50-input.active', function(e) {
        if (e.which == 13) {
            // needed to prevent newline being inserted into active contenteditable
            e.preventDefault();

            // send input to stdin, create new content editable area
            me.socket.emit('stdin', $(this).text() + "\n");
            $(this).removeClass('active').attr('contenteditable', false).after('\n');
            $console = $(this).parents('.run50-console');
            $console.append('<div class="run50-input active" contenteditable="true"></div>');
            $console.find('.run50-input.active').focus();
        }
    });
};

/**
 * Execute a queue of commands in sequence
 *
 * @param commands Queue of commands to execute
 *
 */
CS50.Run.prototype.execute = function(commands) {
    // execute next command in queue
    var command = commands.shift();
    if (command) {
        // connect to server
        this.socket = io.connect(this.options.endpoint, {
            'force new connection': true
        });

        var $container = $(this.options.container);
        var $console = $container.find('.run50-console');

        // update status bar
        var $status = $container.find('.run50-status .status-text'); 
        $status.text((commands.length) ? 'Building...' : 'Running...');

        // display command in console
        $container.find('.run50-input.active').text(command).removeClass('active').after('\n');
        $container.find('.run50-console').append('<div class="run50-input active" contenteditable="true"></div>');
        $container.find('.run50-input.active').focus();
        this.scroll($container);

        // listen for success
        var me = this;
        this.socket.on('success', function(data) {
            me.socket.disconnect();

            // error occurred on a command, so halt execution of queue and display error
            if (data.code !== 0)
                me.failure($(me.options.container));

            // successful, so continue execution queue
            else {
                // create new console line
                me.newline($container, commands.length === 0);
                
                // on last command, display successful run message
                if (commands.length === 0) {
                    $status.text('Run successful!');
                
                    // delay a bit so they don't fade before message changes
                    setTimeout(function() {
                        $container.find('.btn-run').removeClass('uploading running');
                        $container.find('.run50-status .status-loader').fadeOut(); 
                        $container.find('.run50-status').addClass('success');
                    }, 300);

                    setTimeout(function() {
                        if ($status.text() == 'Run successful!')
                            $('.run50-status').removeClass('success');
                            $status.fadeOut(function() {
                                $status.text('');
                                $status.show();
                            });
                    }, 2000);
                }
                else {
                    // execute the next command in the queue
                    me.sandbox = data.sandbox;
                    me.execute(commands);
                }
            }
        });

        // listen for error
        this.socket.on('error', function(data) {
            me.socket.disconnect();
            me.failure($(me.options.container), data.error.code);
        });
        
        // listen for stdout
        this.socket.on('stdout', function(data) {
            // prepend data, and adjust text indent to match
            var $prompt = $('<span>' + data + '</span>');
            var $input = $container.find('.run50-input.active').before($prompt);
            var indent = $prompt.position().left - 
                parseInt($(me.options.container).find('.run50-console').css('padding-left')) + 
                $prompt.width();
            $input.css({
                "text-indent": indent,
                "min-width": indent,
                "margin-left": -indent
            });
            $prompt.replaceWith($prompt.text());
            me.scroll($container);
        });

        // listening and buffering for standard error
        var buffer = "";
        this.socket.on('stderr', function(data) {

            /* DJM: temporarily here until ANSI bug is resolved */
            //$container.find('.run50-input.active').before(data.toString());
            //me.scroll($container);

            //DJM: temporarily disabled until ANSI bug is resolved
            // if we get a valid ansi sequence, display the message
            buffer += data;           
            if (validANSI(buffer)) {
                // get colored buffer and correct for newlines
                var colored = ansispan(buffer).replace(/\r\n<\/span>/g, "</span><br/>")
                                .replace(/\n<\/span>/g, "</span><br/>")
                                .replace(/<span>\r\n/g, "<br/><span>")
                                .replace(/<span>\n/g, "<br/><span>");

                // display error message
                $container.find('.run50-input.active').before(colored);
                me.scroll($container);
                blah = colored;
                // clear the buffer    
                buffer = "";
            }
        });

        // send command to server
        this.socket.emit('run', {
            cmd: command,
            sandbox: this.sandbox
        });
    }
};

/**
 * Reusable function for an execution failure
 * @param $container container for scoping selectors
 * @param data data associated with the error, optional
 *
 */
CS50.Run.prototype.failure = function($container, code) {
    var me = this;
  
    // display error-specific text
    var text = 'An error occurred.';
    switch (code) {
        case 'E_TIMEOUT':
            text = 'Your program took too long to run!';
            break;

        case 'E_USAGE':
            text = 'CS50 Run was used incorrectly';
            break;

        case 'E_KILLED':
            text = 'Your program was terminated!';
            break;

        case 'E_USER_SERVER_DOWN':
            // client side errors, include newline
            text = "CS50 Run seems to be down. Wait and try again?";
            break;

        case 'E_USER_UPLOAD_ERROR':
            // client side errors, include newline
            text = "Upload failed! Wait and try again?";
            break;
    }

    // display error message
    $container.find('.run50-status .status-text').text(text);
   
    // update status area
    $container.find('.run50-status').addClass('error');
    setTimeout(function() {
        $('.run50-status').removeClass('error success');
    }, 2000);

    // reenable buttons
    $container.find('.btn-run').removeClass('uploading running');
    $container.find('.run50-status .status-loader').fadeOut(); 

    // create new console line without prompt
    me.newline($container, true);
}

/**
 * Get the code currently loaded into the editor
 *
 */
CS50.Run.prototype.getCode = function() {
    return this.editor.getValue();
}

/**
 * Reusable function for creating a new input line and scrolling to it
 * @param $container container for scoping selectors
 * @param hidePrompt bool on whether to display prompt on next line
 *
 */
CS50.Run.prototype.newline = function($container, hidePrompt) {
    // create new input line
    $container.find('.run50-input.active').removeClass('active').attr('contenteditable', false);

    // determine whether to display the prompt or not
    var $input = $('<div class="run50-input active" contenteditable="false"></div>');
    if (!hidePrompt) {
        var $prompt = $('<span>' + this.options.prompt + ' </span>');
        $container.find('.run50-console').append($prompt);
        var indent = $prompt.position().left - 
            parseInt($(this.options.container).find('.run50-console').css('padding-left')) + 
            $prompt.width();
        $input.css({
            "text-indent": indent,
            "min-width": indent,
            "margin-left": -indent
        });
        $prompt.replaceWith($prompt.text());
    }
    $container.find('.run50-console').append($input);
    
    // scroll to bottom of container
    this.scroll($container);
}

/**
 * Run the current editor contents
 *
 */
CS50.Run.prototype.run = function() {
    // construct commands to run
    var commandsToRun = _.map(this.commands[this.language].slice(0), function(e) {
        return e.command + ' ' + e.args
    });

    // upload file and then run the necessary commands
    this.upload('file.' + this.extensions[this.language], commandsToRun);
};

/**
 * Change the editor's language
 *
 * @param mime MIME type of new language
 *
 */
CS50.Run.prototype.setLanguage = function(mime) {
    var $container = $(this.options.container);

    // update editor language
    this.language = mime;
    this.editor.setOption('mode', mime);

    // update options menu
    var me = this;
    var $options = $container.find('.run50-options').empty();
    _.each(this.commands[mime], function(e) {
        $options.append(me.templates.runOption({ 
            cmd: e
        }));
    });
};

/**
 * Scroll to the bottom of the console
 *
 * @param $container Container to scroll
 *
 */
CS50.Run.prototype.scroll = function($container) {
    $container.find('.run50-console').scrollTop(999999);
}

/**
 * Upload a file, then execute the given commands
 *
 * @param commands Commands to execute after uploading file
 *
 */
CS50.Run.prototype.upload = function(filename, commands) {
    var me = this;

    // update status bar
    var $status = $(me.options.container).find('.run50-status .status-text');
    $status.text('Uploading source code...');

    // upload file to server with editor contents
    var me = this;
    var data = {};
    data[filename] = this.editor.getValue();
     
    // reference to function for manually aborting an upload
    var $container = $(this.options.container);
    var $runBtn = $container.find('.btn-run');
    var abortUpload = function(e) {
        xhr.abort();
    }

    var xhr = $.ajax({
        data: data,
        dataType: 'json',
        type: 'post',
        url: this.options.endpoint + '/upload',
        beforeSend: function(xhr) {
            $runBtn.click(abortUpload);
            
            // abort and notify user if connection never made to the server
            setTimeout(function() {
                if (xhr.readyState == 0) {
                    xhr.abort();
                }
            }, 10000);
        },
        // after file is uploaded, execute given commands
        success: function(data, textStatus, jqXHR) {
            // prepend prompt, compensate for spacing
            var $prompt = $('<span>' + me.options.prompt + ' </span>');
            var $input = $(me.options.container).find('.run50-input.active').before($prompt);
            var indent = $prompt.position().left - 
                parseInt($(me.options.container).find('.run50-console').css('padding-left')) + 
                $prompt.width();
            $input.css({
                "text-indent": indent,
                "min-width": indent,
                "margin-left": -indent
            });
            $prompt.replaceWith($prompt.text());
            
            // unbind manual upload abort event handler
            $runBtn.removeClass('uploading').addClass('running');
            me.sandbox = { homedir: data.id };
            me.execute(commands);
        },
        error: function(data, txtStatus, jqXHR) {
            // handle different errors
            var error;
            if (data.readyState === 0 || (data.readyState == 4 && data.status !== 200)) {
                me.failure($(me.options.container), 'E_USER_SERVER_DOWN');
            }
            else {
                me.failure($(me.options.container), 'E_USER_UPLOAD_ERROR');
            }
        },
        complete: function(jqXHR, textStatus) {
            // cleanup
            $runBtn.unbind('click', abortUpload);
        }
    });

    return false;
};
