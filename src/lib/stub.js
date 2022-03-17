import {findCmpFrame} from "./consenthandler/proxy/proxyFactory";
export const PUBCID_FRAME = "_pubcidLocator";

export function initPubcidStub(doc, _handler){
    function processEvent(event) {
        // eslint-disable-next-line no-console
        console.log('processEvent', event);
        const pubcid = _handler.readPubcid();
        console.log("msg rcv", event.data, pubcid); // eslint-disable-line no-console

        // send message back
        // Validate that the message is intended for us.
        // TODO: Need a better handshake.
        if (event.data === 'pubcid')
            event.source.postMessage(JSON.stringify({pubcid: pubcid}), event.origin);
    }

    console.log("start stub"); // eslint-disable-line no-console
    if(!findCmpFrame(PUBCID_FRAME)){
        const iframe = doc.createElement('iframe');
        iframe.name = PUBCID_FRAME;
        console.log("iframe", iframe); // eslint-disable-line no-console
        doc.documentElement.appendChild(iframe);

        // Need to add a listener tot he current window.  Find it thru the document object since
        // window object is not passed in.
        let win = doc.defaultView || doc.parentWindow;
        win.addEventListener("message", processEvent);
    }
}

function listener(msgObject){
    return new Promise((resolve) => {
        console.log("starting caller"); // eslint-disable-line no-console
        window.addEventListener("message", (event) => {
            console.log("caller: ", event.data); // eslint-disable-line no-console
            // Validate the message is intended for us.
            // TODO: Need a better handshake here, too.
            if (event.data.startsWith('{'))
                resolve(event.data)
        });
        msgObject.postMessage("pubcid", "*");
    });
}

export async function sendPubcidMsg(){
    const locator = findCmpFrame(PUBCID_FRAME);
    let result = await listener(locator);
    return result;
}
