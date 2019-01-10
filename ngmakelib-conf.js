var NGMakeLib = require('ngmakelib').NGMakeLib;

// Initialize NGMakeLib with entry point source file and module name
var ngMakeLib = new NGMakeLib('src/lib/filebrowser.module.ts', 'angular-filebrowser');

// Add asset
ngMakeLib.addAssets([
        'stupid_worker.js',
        'libgit2.js',
        'libgit2.wasm'
    ].map(a => 'src/assets/' +a)
);

// Create the library and watch for changes
if(process.argv[process.argv.length-1] === '--watch') {
    ngMakeLib.watch();
} else {
    ngMakeLib.packageJSONConfig.dependencies = {
        "deep-diff": "1.0.2"
    };
    ngMakeLib.packageJSONConfig.devDependencies = {};
    ngMakeLib.build();
}