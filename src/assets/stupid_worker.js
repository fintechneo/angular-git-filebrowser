// "Stupid" web worker that accepts scripts

self.onmessage = (msg) => {  
    // Accept script from main thread      
    
    const func = new Function('params',
            msg.data.func.substring(
                msg.data.func.indexOf('{') + 1, 
                msg.data.func.lastIndexOf('}')
            )            
        );
    
    try {
        const result = func(msg.data.params);
        
        if(result && result.then) {
            result.then((ret) =>
                postMessage({id: msg.data.id, response: ret})
            );
        } else {
            postMessage({id: msg.data.id, response: result});
        }
    } catch(e) {
        postMessage({id: msg.data.id, response: null, error: JSON.stringify(e)});
    }
};

console.log('Stupid worker started');