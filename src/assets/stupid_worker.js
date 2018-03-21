// "Stupid" web worker that accepts scripts

self.onmessage = (msg) => {  
    // Accept script from main thread      
    const result = eval(msg.data);
    if(result && result.then) {
        result.then((ret) => postMessage(ret));
    } else {
        postMessage(result);
    }
};

console.log('Stupid worker started');