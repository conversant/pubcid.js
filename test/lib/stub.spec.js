import chai from 'chai';
import sinon from "sinon";
import sinonChai from 'sinon-chai';
import * as cookie from "../../src";
import PubcidHandler from "../../src/lib/pubcidHandler";
import {initPubcidStub, sendPubcidMsg} from "../../src/lib/stub";

chai.use(sinonChai);
const expect = chai.expect;

describe.only('Pubcid stub', ()=>{
    let handler;
    before(()=>{
        handler = new PubcidHandler();
        cookie.setCookie('_pubcid', 'pubcid value');
    });
    after(
        // TODO: clean up both listeners
        ()=>{ cookie.delCookie('_pubcid'); }
    );

    it('send receive message', async ()=>{
        initPubcidStub(document, handler);
        const result = await sendPubcidMsg();
        expect(result).equals(JSON.stringify({pubcid: 'pubcid value'}));
    });
});
