This is work in progress - but if you can't wait to test it you should run:

```
npm install
npm start
``` 

navigate your browser to `http://localhost:4200`

Click the `clone` button to clone the selected repository. Access to github is via a proxy that can be configured using `proxy.conf.json` (change to another organization then fintechneo if you want to test your own repositories).

A quick video demonstration of what you can expect to see is here: https://youtu.be/rcBluzpUWE4

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