$(function() {
    // define templates
    var templateHtml = {
        diff: ' \
            <div class="check50-container"> \
            </div> \
        ',

        test: ' \
            <div class="check50-test"> \

            </div>
        ',
    };

    // compile templates
    this.templates = {};
    for (var template in templateHtml)
        this.templates[template] = _.template(templateHtml[template]);

    // create the diffing interface
}
