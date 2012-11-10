// maintain compatibility with other CS50 libraries
var CS50 = CS50 || {};

/**
 * CS50 Check constructor
 *
 * @param options {Object} Check options:
 *      container: DOM element into which editor will be loaded
 *      check50Id: ID of check to display
 *      check50Url: URL to fetch checks from
 */
CS50.Check = function(options) {
    this.options = options;

    // make sure default options are defined
    if (!this.options.container)
        throw 'Error: You must define a container for run50!';

    // make sure a URL for a check is specified
    if (!this.options.check50Id)
        throw "Error: You must provide the ID of the check to display!"

    // default options
    this.options.check50Url == (options.check50Url == undefined) ? "http://check.cs50.net/" : options.check50Url;

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
                                <th class="expected">Checks</th> \
                                <th class="actual"></th> \
                            <tr> \
                            <% _.each(test.script, function(line, index) { %> \
                                <% var color = (index == test.script.length - 1 && !test.result) ? "wrong" : "right" %> \
                                <tr> \
                                <% if (color === "right") { %> \
                                    <td class="line"><%= index %></td> \
                                    <td colspan="2" class="expected <%= color %>"> \
                                        <%= expected({ expected: line.expected }) %> <span class="passed pull-right">&#10004;</span>\
                                    </td> \
                                <% } else { %> \
                                    <td class="line"><%= index %></td> \
                                    <td class="expected <%= color %>"> \
                                        <%= expected({ expected: line.expected }) %> \
                                    </td> \
                                    <td class="actual <%= color %>"> \
                                        <%= actual({ actual: line.actual, expected: line.expected, correct: false}) %> \
                                    </td> \
                                <% } %> \
                                </tr> \
                            <% }) %> \
                        <% } else { %> \
                            <tr> \
                                <th class="line">!</th> \
                                <th class="expected dependency">Fix the following dependencies first:</th> \
                                <th class="actual dependency"> \
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
        
        expected: ' \
            <% if (expected.type == "stdout" || expected.type == "stderr") { %> \
                <% var type = (expected.type == "stdout") ? "standard out" : "standard in" %> \
                <% var pad = (expected.type == "stdout" && expected.value && expected.value.toString().split("\\n").length > 1) %> \
                <% if (expected.value !== undefined && expected.value == "/^([\\\\s\\\\S]*)$/") { %>\
                    Expecting any sort of <%= type %>. \
                <% } else { %> \
                    <% if (expected.type == "stdout") { %> \
                        Expecting the following on standard in &mdash; \
                    <% } else { %> \
                        Expecting the following on standard in &mdash; \
                    <% } %> \
<pre><% if (pad) { %>\n\n\n<% } %>\
<%= (expected.value !== undefined) ? ansispan(expected.value.toString().replace("/^(", "").replace(")$/", "")) : "" %></pre> \
                <% } %> \
            <% } else { %> \
                <% if (expected.type == "exit") { %> \
                    Expecting an exit code of \
                <% } else if (expected.type == "stdin") { %> \
                    <% if (expected.value === undefined) { %> \
                        Expecting a prompt for standard input ... \
                    <% } else { %> \
                        Takes in standard input of \
                    <% } %> \
                <% } else if (expected.type == "exists") { %> \
                    Checking for file \
                <% } else if (expected.type == "run") { %> \
                    Running... \
                <% } %> \
                <pre><%= (expected.value !== undefined) ? ansispan(expected.value.toString().replace("\\n", "")) + "." : "" %></pre> \
            <% } %> \
        ', 

        actual: ' \
            <% console.log(actual) %> \
            <% if (actual) { %> \
                <% if (actual.type == "stdout") { %> \
... but received the following on standard out instead &mdash; \
                <% } else if (actual.type == "exit") { %> \
... but received an exit code of \
                <% } else if (actual.type == "stderr") { %> \
... but received the following on standard error instead &mdash; \
                <% } else if (actual.type == "stdin") { %> \
... but received the following on standard in instead &mdash; \
                <% } else if (actual.type == "exists") { %> \
... but received the following file instead &mdash; \
                <% } %> \
                <% var pad = (actual.type == "stdout" && actual.value && actual.value.toString().split("\\n").length > 2) %> \
                <pre><% if (pad) { %>\n\n<% } %><%= ansispan(actual.value.toString().replace(/\\n+$/,"")) %></pre> \
            <% } else { %> \
                <% if (expected.type == "exists") { %> \
... but received no such file! \
                <% } %> \
            <% } %> \
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

    $.get(this.options.check50Url, {
        check: this.options.check50Id
    }, function(response) {
        // get this particular check, and parse the results
        response = response.slice(response.indexOf('{'));
        tests = JSON.parse(response);
        _.each(tests.results, function(item, index) {
            $container.find('.check50-container').append($(me.templates.test({
                tests: tests.results,
                name: index,
                test: item,
                expected: me.templates.expected,
                actual: me.templates.actual
            })));
        });
    });

    afterCreate();
};
