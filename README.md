This is CS50 Run: Client.
---

The CS50 Run Client is a reusable widget that, along with the CS50 Run Server, allows for sandboxed execution of code.

# Editor

To create a new editor, instantiate a new `CS50.Run` object:

    var run = new CS50.Run({
        container: '#run',
        defaultLanguage: 'C',
        languages: ['C', 'Java', 'PHP', 'Python', 'Ruby'],
    });

The options object passed to the `CS50.Run` constructor can define the following keys:

* `container`: DOM element into which editor will be loaded.
* `defaultLanguage`: Default language for the editor (C, Java, PHP, Python, Ruby).
* `languages`: Array of languages user can choose from (C, Java, PHP, Python, Ruby).
* `runUrl`: Location of server's /run route.
* `socketUrl`: Location of server's / route.
* `uploadUrl`: Location of server's /upload route.

Of these keys, `container` is required.

# License

http://creativecommons.org/licenses/by-nc-sa/3.0/