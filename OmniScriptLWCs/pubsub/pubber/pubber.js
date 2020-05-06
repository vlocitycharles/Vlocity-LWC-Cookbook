// The imports we need as a minimum
import { LightningElement, track, wire } from "lwc";
// import { CurrentPageReference } from 'lightning/navigation';
import { OmniscriptBaseMixin } from "vlocityins2/omniscriptBaseMixin";
import { fireEvent } from 'c/pubsub';

export default class Pubber extends OmniscriptBaseMixin(LightningElement) {
	// @wire(CurrentPageReference) pageRef;

	// This holds the label which will be shown on the button
	@track buttonlabel = "Click Me";


	// This is called when we're ready to go ... it will see if there's a custom label set
	connectedCallback() {
		// For debugging, reference purposes
		// console.log(JSON.stringify(this.omniJsonDef));

		// We are pretty certain that this will have some value
		this.buttonlabel = this.omniJsonDef.propSetMap.label;
	}

	/**
	 * Handle the click of the button.
	 *
	 * It just sets a couple of values in the OmniScript's data JSON
	 *
	 * @param {*} event     Ignored for now
	 */
	// eslint-disable-next-line no-unused-vars
	handleClick(event) {
		console.log('Firing Event! PageRef = ' + JSON.stringify(this.pageRef));
		fireEvent('getMeRewrite', String(new Date()));
	}
}