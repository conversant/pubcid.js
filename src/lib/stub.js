import {findCmpFrame} from "./consenthandler/proxy/proxyFactory";
export const PUBCID_FRAME = "_pubcidLocator";

export function initPubcidStub(_handler){
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
        // eslint-disable-next-line no-console
        console.log("msg rcv", JSON.stringify(json), pubcid);
        // send message back
        const frame = findCmpFrame(json.frameid);
        frame.postMessage(JSON.stringify({pubcid: pubcid}));
    }

    const iframe = document.createElement('iframe');
    iframe.name = PUBCID_FRAME;
    document.body.appendChild(iframe);
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
        console.log("response received", event.data);
        if(event && event.data && event.data.pubcid)
        callback(event);
    });
    locator.postMessage(JSON.stringify({frameid: frame.id}));
}
