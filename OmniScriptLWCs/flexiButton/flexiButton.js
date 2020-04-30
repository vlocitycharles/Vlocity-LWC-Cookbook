/**
 * FlexiButton
 * 
 * This is a more sophisticated button LWC that allows passing in custom
 * properties to define the appearance of the button.  When clicked, it
 * merely sets a value indicating that it's been clicked.
 * 
 * The custom properties used are:
 * 
 * title    The hover text title of the button
 * variant  The variant (base, Neutral, success, etc.)
 *          See: https://developer.salesforce.com/docs/component-library/bundle/lightning-button/example
 */

 // The imports we need as a minimum
 import { LightningElement, track, api } from 'lwc';
 import { OmniscriptBaseMixin } from 'vlocityins2/omniscriptBaseMixin';
 
 export default class FlexiButton extends OmniscriptBaseMixin(LightningElement) {
 
     // This holds the label which will be shown on the button
     @track buttonLabel = "Click Me";
     @track buttonTitle = "Click Me and Good Things Happen";
     @track buttonVariant = "Neutral";

     @api
     get title() {
         return this.buttonTitle;
     }
     set title(value) {
         this.buttonTitle = value;
     }

     @api
     get variant() {
         return this.buttonVariant;
     }
     set variant(value) {
         this.buttonVariant = value;
     }
 
     // This is called when we're ready to go ... it will see if there's a custom label set
     connectedCallback() {
 
         // For debugging, reference purposes
         // console.log(JSON.stringify(this.omniJsonDef));
 
         // We are pretty certain that this will have some value
         this.buttonLabel = this.omniJsonDef.propSetMap.label;
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
         let now = new Date();
         this.omniUpdateDataJson(String(now));
     }
 }