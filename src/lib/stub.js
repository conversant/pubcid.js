import {findCmpFrame} from "./consenthandler/proxy/proxyFactory";
export const PUBCID_FRAME = "_pubcidLocator";

export function initPubcidStub(doc, _handler){
    function processEvent(event) {
        // eslint-disable-next-line no-console
        console.log('processEvent', event);

        let json = {};
        try {
            json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        }
        catch(e){
            // if it can't be parsed it's not for this handler
        }
        const pubcid = _handler.readPubcid();
        console.log("msg rcv", JSON.stringify(json), pubcid); // eslint-disable-line no-console
        // send message back
        event.source.postMessage(JSON.stringify({pubcid: pubcid}), event.origin);
    }

    console.log("start stub"); // eslint-disable-line no-console
    if(!findCmpFrame(PUBCID_FRAME)){
        const iframe = doc.createElement('iframe');
        iframe.name = PUBCID_FRAME;
        console.log("iframe", iframe); // eslint-disable-line no-console
        doc.documentElement.appendChild(iframe);
        iframe.addEventListener("message", processEvent);
    }
}

function listener(msgObject, handler){
    return new Promise((resolve, reject) =>{
        const callback = (event) => handler(event, resolve, reject);
        window.addEventListener("message", callback);
        msgObject.postMessage("pubcid");
    })
}

export async function sendPubcidMsg(){
    const locator = findCmpFrame(PUBCID_FRAME);
    const result = await listener(locator, (event, resolve) =>{
        console.log("response received", event.data); // eslint-disable-line no-console
        if(event && event.data && event.data){
            resolve(event.data);
        }
        return result;
    })
}
