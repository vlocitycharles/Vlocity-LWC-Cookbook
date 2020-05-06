import { LightningElement, track, wire } from "lwc";
import { OmniscriptBaseMixin } from "vlocityins2/omniscriptBaseMixin";
// import { CurrentPageReference } from "lightning/navigation";
// import { ShowToastEvent } from "lightning/platformShowToastEvent";

import { registerListener, unregisterAllListeners } from "c/pubsub";

export default class Subber extends OmniscriptBaseMixin(LightningElement) {
  @track value = "Nothing yet";

  // @wire(CurrentPageReference) pageRef;

  connectedCallback() {
    registerListener("getMeRewrite", this.handleGetMeRewrite, this);
  }

  disconnectedCallback() {
    // unsubscribe from searchKeyChange event
    unregisterAllListeners(this);
  }

  handleGetMeRewrite(newValue) {
    this.value = "Incoming message: " + newValue;
  }
}