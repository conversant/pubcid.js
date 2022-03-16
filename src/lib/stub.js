import {findCmpFrame} from "./consenthandler/proxy/proxyFactory";
export const PUBCID_FRAME = "_pubcidLocator";

export function initPubcidStub(doc, _handler){
    console.log("start stub", doc); // eslint-disable-line no-console
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
        event.source.postMessage(JSON.stringify({pubcid: pubcid}));
    }

    console.log("start stub"); // eslint-disable-line no-console
    const iframe = doc.createElement('iframe');
    iframe.name = PUBCID_FRAME;
    console.log("iframe", iframe); // eslint-disable-line no-console
    doc.documentElement.appendChild(iframe);
    iframe.addEventListener("message", processEvent);
}

export function sendPubcidMsg(callback){
    const locator = findCmpFrame(PUBCID_FRAME);
    const frame = window.frameElement;

    // eslint-disable-next-line no-console
    console.log('frame', frame);
    // eslint-disable-next-line no-console
    console.log('locator', locator);

    window.addEventListener("message", (event)=>{
        console.log("response received", event.data); // eslint-disable-line no-console
        if(event && event.data && event.data.pubcid)
        callback(event);
    });
    locator.postMessage(JSON.stringify({frameid: "frame.id"}));
}
