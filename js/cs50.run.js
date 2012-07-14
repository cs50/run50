// maintain compatibility with other CS50 libraries
var CS50 = CS50 || {};

/**
 * CS50 Run constructor
 *
 * @param options Editor options:
 *      container: DOM element into which editor will be loaded
 *      defaultLanguage: Language to start the editor off in (C, Java, PHP, Python, Ruby)
 *      height: Height of the editor, not including the console
 *      languages: Languages user can choose from (C, Java, PHP, Python, Ruby)
 *      runUrl: Location of server's /run route
 *      socketUrl: Location of server's / route
 *      uploadUrl: Location of server's /upload route
 *      width: Width of the editor
 *
 */
CS50.Run = function(options) {
    this.options = options;

    // make sure default options are defined
    if (!this.options.container)
        throw 'Error: You must define a container for run50!';

    // define default options
    this.options.defaultLanguage = (options.defaultLanguage === undefined) ? 'C' : options.defaultLanguage;
    this.options.languages = (options.languages === undefined) ? ['C', 'Java', 'PHP', 'Python', 'Ruby'] : options.languages;
    this.options.runUrl = (options.runUrl === undefined) ? '/run' : options.runUrl;
    this.options.socketUrl = (options.socketUrl === undefined) ? '/' : options.socketUrl;
    this.options.uploadUrl = (options.uploadUrl === undefined) ? '/upload' : options.uploadUrl;

    // map from mimes to commands necessary to run code
    this.commands = {
        'text/x-csrc': [
            { command: 'clang file.c', args: '-lcs50 -std=c99 -Wall -Werror' },
            { command: './a.out', args: '' }
        ],

        'text/x-java': [
            { command: 'javac Class.java', args: '' },
            { command: 'java', args: 'Class' }
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
int\n\
main(int argc, char *argv[])\n\
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
                    <a href="#" class="btn-run"> \
                       <img class="run-img" src="img/run.png"/>  \
                       <img class="paused-img" src="img/ajax-loader.gif"/>  \
                    </a> \
                    <div class="run50-lang-wrapper"> \
                        <select class="run50-lang"> \
                            <% for (var i in languages) { %> \
                                <option value="<%= languageNames[languages[i]] %>"><%= languages[i] %></option> \
                            <% } %> \
                        </select>\
                    </div> \
                    <a href="#" class="btn-options"> \
                        <img src="img/gear.png"/> \
                        <span>Command Line</span> \
                    </a> \
                    <div class="run50-options"></div> \
                    <div class="run50-status"> \
                        <span class="status-text"></span> \
                        <img class="status-loader" src="img/ajax-bar.gif"/> \
                    </div> \
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
            <label for="<%= cmd.command %>"><%= cmd.command %></label> \
            <input id="<%= cmd.command %>" type="text" value="<%= cmd.args %>" /> \
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
        }
        
        // replace button image and run code
        else {
            $(this).addClass('running');
            $(this).find('.run-img').hide();
            $(this).find('.paused-img').show();

            $('.run50-status .status-loader').fadeIn(); 
            $('.run50-controls').removeClass('.success, .error');
            me.run();
        }
    });

    // catch ctrl-c and ctrl-d inside input
    $container.on('keyup', '.run50-input', function(e) {
        if (e.ctrlKey) {
            // ctrl-c
            if (e.which == 67)
                me.socket.emit('SIGINT');
            else if (e.which == 68)
                me.socket.emit('EOF');
        }
    });

    // when language is changed, load relevant mode file
    $container.on('change', '.run50-lang', function() {
        me.setLanguage($(this).val());
    });
    $container.find('.run50-lang').val(this.languageNames[this.options.defaultLanguage]).combobox().trigger('change');

    // when options is moused over, display run options
    $container.on('click', '.btn-options', function() {
        $options = $container.find('.run50-options');

        if ($options.is(":visible"))
            $container.find('.run50-options').slideUp('fast');
        else  
            $container.find('.run50-options').slideDown('fast');
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
        // determine which text input was change
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
            me.socket.emit('stdin', $(this).text() + "\n");
            $(this).removeClass('active').attr('contenteditable', false);

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
    // reusable function for an execution failure
    function failure($container, data) {
        // display error-specific text
        var text = 'An error occurred.';
        if (data) {
            if (data.error.code == 'E_TIMEOUT')
                text = 'Your program took too long to run!';
            else if (data.error.code == 'E_KILLED')
                text = 'Your program\'s execution was terminated!';
            else if (data.error.code == 'E_USAGE')
                text = 'CS50 Run was used incorrectly';
        }

        // display error message
        $container.find('.run50-status .status-text').text(text);
       
        // update status area
        $container.find('.run50-status').addClass('error');
        setTimeout(function() {
            $('.run50-status').removeClass('error success');
        }, 2000);

        // reenable buttons
        $container.find('.btn-run').removeClass('running');
        $container.find('.paused-img').hide();
        $container.find('.run-img').show();
        $container.find('.run50-status .status-loader').fadeOut(); 

        // create new console line without prompt
        newline($container, true);
    }

    // reusable function for creating a new input line and scrolling to it
    function newline($container, hidePrompt) {
        // create new input line
        $container.find('.run50-input.active').remove();

        // determine whether to display the prompt or not
        var $input = $('<div class="run50-input active" contenteditable="false"></div>');
        if (!hidePrompt) {
            var $prompt = $('<span>jharvard@run.cs50.org (~): </span>');
            $container.find('.run50-console').append($prompt)
            $input.css('text-indent', $prompt.width());
            $prompt.replaceWith($prompt.text());
        }
        $container.find('.run50-console').append($input);
        
        // scroll to bottom of container
        scroll($container);
    }

    // reusable function for scrolling to the bottom of the console
    function scroll($container) {
        $container.find('.run50-console').scrollTop(999999);
    }

    // execute next command in queue
    var command = commands.shift();
    if (command) {
        // connect to server
        this.socket = io.connect(this.options.socketUrl, {
            'force new connection': true
        });

        var $container = $(this.options.container);
        var $console = $container.find('.run50-console');

        // update status bar
        var $status = $container.find('.run50-status .status-text'); 
        $status.text((commands.length) ? 'Building...' : 'Running...');

        // display command in console
        $container.find('.run50-input.active').text(command).removeClass('active');
        $container.find('.run50-console')
            .append('<div class="run50-input active" contenteditable="true"></div>');
        $container.find('.run50-input.active').focus();
        scroll($container);

        // listen for success
        var me = this;
        this.socket.on('success', function(data) {
            me.socket.disconnect();

            // error occurred on a command, so halt execution of queue and display error
            if (data.code !== 0)
                failure($(me.options.container));

            // successful, so continue execution queue
            else {
                // create new console line
                newline($container, commands.length === 0);
                
                // on last command, display successful run message
                if (commands.length === 0) {
                    $status.text('Run successful!');
                
                    // delay a bit so they don't fade before message changes
                    setTimeout(function() {
                        $container.find('.btn-run').removeClass('running');
                        $container.find('.paused-img').hide();
                        $container.find('.run-img').show();
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
            failure($(me.options.container), data);
        });

        // listen for stdout
        this.socket.on('stdout', function(data) {
            // prepend data, and adjust text indent to match
            var $prompt = $('<span>' + data + '</span>');
            var $input = $container.find('.run50-input.active').before($prompt);
            $input.css('text-indent', $prompt.width());
            $prompt.replaceWith($prompt.text());
            scroll($container);
        });

        // listen for stderr
        this.socket.on('stderr', function(data) {
            // ignore sandbox errors
            if (!data.match(/Failed to remove directory \/tmp\/[\.\w\-]+: No such file or directory/)) { 
                // strip sandbox path from error message
                data = data.replace(/\/tmp\/sandboxes\/[\w-]+\//g, '');
                
                // display error message
                $container.find('.run50-input.active').before('<span style="color: red">' + data + '</span>');
                scroll($container);
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
 * Get the code currently loaded into the editor
 *
 */
CS50.Run.prototype.getCode = function() {
    return this.editor.getValue();
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
 * Upload a file, then execute the given commands
 *
 * @param commands Commands to execute after uploading file
 *
 */
CS50.Run.prototype.upload = function(filename, commands) {
    // prepend prompt
    var $prompt = $('<span>jharvard@run.cs50.org (~): </span>');
    var $input = $(this.options.container).find('.run50-input.active').before($prompt);
    $input.css('text-indent', $prompt.width());
    $prompt.replaceWith($prompt.text());

    // update status bar
    var $status = $(this.options.container).find('.run50-status .status-text');
    $status.text('Uploading file...');

    // upload file to server with editor contents
    var me = this;
    var data = {};
    data[filename] = this.editor.getValue();
    $.ajax({
        data: data,
        dataType: 'json',
        type: 'post',
        url: this.options.uploadUrl,

        // after file is uploaded, execute given commands
        success: function(data, textStatus, jqXHR) {
            me.sandbox = { homedir: data.id };
            me.execute(commands);
        }
    });

    return false;
};
