// maintain compatibility with other CS50 libraries
var CS50 = CS50 || {};

/**
 * CS50 Run constructor
 *
 * @param options {Object} Editor options:
 *      container: DOM element into which editor will be loaded
 *      defaultCode: Value of the code editor when no history is loaded
 *      defaultLanguage: Language to start the editor off in (C, Java, PHP, Python, Ruby)
 *      endpoint: URL of CS50 Run's server
 *      languages: Array of languages user can choose from (C, Java, PHP, Python, Ruby)
 *      onCreate: Callback for editor creation
 *      onDownload: Callback for download button pressed
 *      onLoadFromHistory: Callback for loading a revision from a user's history
 *      onSave: Callback for saving a revision
 *      prompt: Prompt to be displayed in the console
 *      scrollback: Number of characters to be displayed in the console at once
 */
CS50.Check = function(options) {
    this.options = options;

    // make sure default options are defined
    if (!this.options.container)
        throw 'Error: You must define a container for run50!';

    // make sure a URL for a check is specified
    if (!this.options.check50Id)
        throw "Error: You must provide the ID of the check to display!"

    // define templates
    var templateHtml = {
        // template for the results container
        results: ' \
            <div class="check50-container"> \
            </div> \
        ',

        // template for a single test
        test: ' \
            <div class="check50-test"> \
                <% var statusClass = test.result ? "success" : (test.result == false) ? "error" : "dependency" %> \
                <div class="check50-test-desc <%= statusClass %>"> \
                    <div class="check50-test-indicator"></div> \
                    <h1><%= test.description %></h1> \
                    <div class="check50-test-expand"></div> \
                </div> \
                <div class="check50-diff"> \
                    <table> \
                        <% if (test.result != null) { %> \
                            <tr> \
                                <th class="line">#</th> \
                                <th class="actual">Actual</th> \
                                <th class="expected">Expected</th> \
                            <tr> \
                            <% _.each(test.script, function(line, index) { %> \
                                <% var color = (index == test.script.length - 1) ? "wrong" : "right" %> \
                                <tr> \
                                    <td class="line"><%= index %></td> \
                                    <% if (index == test.script.length - 1) { %> \
                                        <td class="actual <%= color %>"> \
                                            <%= lineTpl({ line: (line.actual ? line.actual : { type: "", value: "" }) }) %> \
                                        </td> \
                                    <% } else { %> \
                                        <td class="actual <%= color %>"> \
                                            <%= lineTpl({ line: (line.actual ? line.actual : line.expected) }) %> \
                                        </td> \
                                    <% } %> \
                                    <td class="expected <%= color %>"> \
                                        <%= lineTpl({ line: line.expected }) %> \
                                    </td> \
                                </tr> \
                            <% }) %> \
                        <% } else { %> \
                            <tr> \
                                <th class="line">!</th> \
                                <th class="actual dependency">Fix the following dependencies first:</th> \
                                <th class="expected dependency"> \
                                    <ul> \
                                    <% _.each(test.dependencies, function(dependency) { %> \
                                        <li><%= tests[dependency].description %></li> \
                                    <% }) %> \
                                    </ul> \
                                </th> \
                            <tr> \
                        <% } %> \
                    </table> \
                </div> \
            </div> \
        ', 
        
        line: ' \
            <% if (line.type == "exit") { %> \
                <span class="exit">EXIT</span> \
            <% } else if (line.type == "stderr") { %> \
                <span class="stderr">STDERR</span> \
            <% } else if (line.type == "exists") { %> \
                <span class="exists">FILE</span> \
            <% } %> \
            <%= line.value %> \
        '
    };

    // compile templates
    this.templates = {};
    for (var template in templateHtml)
        this.templates[template] = _.template(templateHtml[template]);

    this.createResults();
};

/**
 * Create a new editor instance
 *
 */
CS50.Check.prototype.createResults = function() {
    var me = this;
    var $container = $(this.options.container);

    // callback to be called after editor is created
    function afterCreate() {
        $container.show();
        $(window).trigger('resize');
    }

    // hide container while it is constructed
    $container.hide();

    // create run container
    $container.html(this.templates.results({
    }));
    
    // open test once test is clicked on            
    $container.on('click', '.check50-test-desc', function(e) {
        // expand or close question depending on if it's currently showing
        if ($(this).hasClass('expanded')) {
            $(this).removeClass('expanded');
            $(this).closest('.check50-test').find('.check50-diff').slideUp(100); 
        } 
        else {
            $(this).addClass('expanded');
            $(this).closest('.check50-test').find('.check50-diff').slideDown(100); 
        }
    });

    // TODO: fetch real data
    var tests = { 
        "id" : "f9eec8581aed4a63b44de9a2da1eaedb",
        "results" : { "compiles" : { "dependencies" : [  ],
              "description" : "mario.c compiles",
              "result" : false,
              "script" : [ { "expected" : { "type" : "run",
                        "value" : "clang -o mario mario.c -lcs50"
                      } },
                  { "actual" : { "type" : "stderr",
                        "value" : "clang: error: no such file or directory: 'mario.c'\n"
                      },
                    "expected" : { "type" : "exit",
                        "value" : 0
                      }
                  }
                ]
            },
          "exists" : { "dependencies" : [  ],
              "description" : "mario.c exists",
              "result" : false,
              "script" : [ { "expected" : { "type" : "exists",
                        "value" : "mario.c"
                      } } ]
            },
          "height of -1" : { "dependencies" : [ "compiles" ],
              "description" : "rejects a height of -1",
              "result" : null,
              "script" : [  ]
            },
          "height of 0" : { "dependencies" : [ "compiles" ],
              "description" : "handles a height of 0 correctly",
              "result" : null,
              "script" : [  ]
            },
          "height of 1" : { "dependencies" : [ "compiles" ],
              "description" : "handles a height of 1 correctly",
              "result" : null,
              "script" : [  ]
            },
        }
    } 

    _.each(tests.results, function(item, index) {
        $container.find('.check50-container').append($(me.templates.test({
            tests: tests.results,
            name: index,
            test: item,
            lineTpl: me.templates.line
        })));
    });

    afterCreate();
};
