This is CS50 Run.
---

CS50 Run is a reusable widget that, along with CS50 Sandbox, allows for sandboxed execution of code.

# Editor

To create a new editor, instantiate a new `CS50.Run` object:

    var run = new CS50.Run({
        container: '#run',
        defaultLanguage: 'C',
        languages: ['C', 'Java', 'PHP', 'Python', 'Ruby'],
    });

The options object passed to the `CS50.Run` constructor can define the following keys:

* `container`: DOM element into which editor will be loaded
* `defaultCode`: Value of the code editor when no history is loaded
* `defaultLanguage`: Language to start the editor off in (C, Java, PHP, Python, Ruby)
* `endpoint`: URL of CS50 Run's server
* `languages`: Array of languages user can choose from (C, Java, PHP, Python, Ruby)
* `onCreate`: Callback for editor creation
* `onDownload`: Callback for download button pressed
* `onLoadFromHistory`: Callback for loading a revision from a user's history
* `onSave`: Callback for saving a revision
* `prompt`: Prompt to be displayed in the console
* `scrollback`: Number of characters to be displayed in the console at once

Of these keys, `container` is required.

# License

http://creativecommons.org/licenses/by-nc-sa/3.0/
