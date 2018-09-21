# Offline web application storage using GIT in the browser

Modern browsers have several mechanisms for storing data while disconnected from the network (IndexedDB, localstorage, etc), and there are also serviceworkers that can provide access to a website when offline. But what about synchronizing changes made by the users of your web application while being disconnected for a while? What if one user makes a change in the top of a document while disconnected, and another user makes a change at the bottom of the same document. What should the document look like when both users come online? And how should that process be handled?

Programmers working in teams have bumped into similar questions, but the last few years most programmers have solved this by using a distributed version control system like GIT. We think this could be a solution also for web applications. If the user editable data is stored in a local GIT repository, we can use the powerful features of GIT to pull updates, merge local and remote changes, and push back locally modified data. And we'll also get versioning, so that we have a log of when data was changed and who did it.

This project is exploring the possibilities of compiling the libgit2 library to WebAssembly and use it in the browser to turn it into a git client.

See our efforts to compile libgit2 with emscripten (for WebAssembly) here: https://github.com/fintechneo/libgit2/tree/master/emscripten_hacks

And some video-demonstrations:

A quick video demonstration of what you can expect to see is here: https://youtu.be/rcBluzpUWE4

Here's another video demo showing editing and merging of file changes: https://youtu.be/xfGrMwLy_tw

### Getting started

This is work in progress - but if you can't wait to test it you should run:

```
npm install
npm start
``` 

navigate your browser to `http://localhost:4200`

Click the `clone` button to clone the selected repository. Access to github is via a proxy that can be configured using `proxy.conf.json` (change to another organization then fintechneo if you want to test your own repositories).

## Large files using git LFS

If you want to upload binaries and large files, it might be a good idea to store contents of these outside the git repository, and instead only commit the pointers to the files in git. This filebrowser may be configured so that uploads will be converted to git LFS pointers, and the contents will be uploaded to an LFS server. A successful LFS commit from the browser can be seen here: https://github.com/fintechneo/browsergittestdata/commit/8e181f3f7800007c56db3150ea4594ce64c78bd8

Read more about git LFS here: https://git-lfs.github.com/

## Creating a local git server for testing

This is an example of using `git http-backend` as a target for CGI through a node http server. 
First install the cgi package: `npm install cgi`

```
    var cgi = require('cgi');
    var http = require('http');
    var path = require('path');
    
    var script = 'git';
    
    http.createServer( cgi(script, {args: ['http-backend'],
        stderr: process.stderr,
        env: {
            'GIT_PROJECT_ROOT': path.resolve(__dirname, 'repos'),
            'GIT_HTTP_EXPORT_ALL': '1',
            'REMOTE_USER': 'hello@blabla.no' // Push requires authenticated users by default
        }
    })).listen(5000);
```
