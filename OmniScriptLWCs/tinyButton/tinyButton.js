/**
 * TinyButton
 * 
 * This is a simple LWC that demonstrates three things:
 * 
 * 1. How to get a custom property from the OmniScript element
 * 2. How to set the value of the element to something
 * 3. How to set any element's value in the data JSON
 * 
 * It is not really intended to be useful as-is, but rather as a
 * starting point for building something more valueable.
 */

 // The imports we need as a minimum
import { LightningElement, track} from 'lwc';
import { OmniscriptBaseMixin } from 'vlocityins2/omniscriptBaseMixin';

export default class TinyButton extends OmniscriptBaseMixin(LightningElement) {

    // This holds the label which will be shown on the button
    @track buttonlabel = "Click Me";

    // This holds the custom parameters which were passed to us in the definition of the custom LWC
    parameters = {};

    // This is called when we're ready to go ... it will see if there's a custom label set
    connectedCallback() {

        // For debugging, reference purposes
        console.log(JSON.stringify(this.omniJsonDef));

        // We are pretty certain that this will have some value
        this.buttonlabel = this.omniJsonDef.propSetMap.label;
        this.parseParams();

        if (this.parameters.hasOwnProperty("label")) {
            this.buttonlabel = this.parameters.label;
        }
    }

    /**
     * Get the parameters for the LWC which have been pased in from the OmniScript as metadata
     */
    parseParams() {
        let params = this.omniJsonDef.propSetMap.customAttributes;

        //  Find the values in the list (don't want to be fussy about the order)
        params.forEach((val) => {
            this.parameters[val.name] = val.source;
        });
    }



    /**
     * Handle the click of the button.
     * 
     * It just sets a couple of values in the OmniScript's data JSON
     * 
     * @param {*} event     Ignored
     */
    handleClick(event) {

        //  Set the value of the button in the data JSON (without really knowing "who" I am)
        this.omniUpdateDataJson({"A": "AA", "B":"BB"});

        //  Set some values explicitly in the data JSON
        this.omniApplyCallResp({"HeyHowdy": "Hi"});
    }
}
