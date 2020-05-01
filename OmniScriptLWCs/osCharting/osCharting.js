import { LightningElement/*, api */ } from "lwc";

import { OmniscriptBaseMixin } from "vlocityins2/omniscriptBaseMixin";

import { loadScript, loadStyle } from "lightning/platformResourceLoader";


const generateRandomNumber = () => {
    return Math.round(Math.random() * 100);
};

export default class OsCharting extends OmniscriptBaseMixin(LightningElement) {

    chart;
    chartjsInitialized = false;
    chartDrawn = false;

    header1 = '';

    params_chartType = 'bar';

    //  Default Data for testing purposes
    params_sourceData = [
        generateRandomNumber(),
        generateRandomNumber(),
        generateRandomNumber(),
        generateRandomNumber(),
        generateRandomNumber()
    ];

    //  Default Charting Options
    params_options = {
        responsive: true,
        legend: {
            position: 'right'
        },
        animation: {
            animateScale: true,
            animateRotate: true
        }
        ,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    };

    params_labels = ['Red', 'Orange', 'Yellow', 'Green', 'Blue'];

    params_title = 'Chart';

    params_background = [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)'
    ];

    // @api
    // get chartType() {
    //     return this.params_chartType;
    // }
    // set chartType(value) {
    //     this.params_chartType = value;
    //     if (this.chartDrawn) {
    //         this.drawchart();
    //     }
    // }


    // @api
    // get sourceData() {
    //     return this.params_sourceData;
    // }
    // set sourceData(value) {
    //     this.params_sourceData = value;
    //     if (this.chartDrawn) {
    //         this.drawchart();
    //     }
    // }

    // @api
    // get options() {
    //     return this.params_options;
    // }
    // set options(value) {
    //     this.params_options = value;
    //     if (this.chartDrawn) {
    //         this.drawchart();
    //     }
    // }

    // @api
    // get labels() {
    //     return this.params_labels;
    // }
    // set labels(values) {
    //     this.params_labels = values;
    //     if (this.chartDrawn) {
    //         this.drawchart();
    //     }
    // }

    // @api
    // get title() {
    //     return this.params_title;
    // }
    // set title(value) {
    //     this.params_title = value;
    //     if (this.chartDrawn) {
    //         this.drawchart();
    //     }
    // }

    // @api
    // get background() {
    //     return this.params_background;
    // }
    // set background(value) {
    //     this.params_background = value;
    //     if (this.chartDrawn) {
    //         this.drawchart();
    //     }
    // }


    /*  *****************************************************************   */
    /*  Initialization Section of code                                      */
    /*  *****************************************************************   */


    // This is called when we're ready to go ... it will see if there's a custom label set
    connectedCallback() {

        // For debugging, reference purposes
        // console.log(JSON.stringify(this.omniJsonDef));

        // We are pretty certain that this will have some value
        this.header1 = this.omniJsonDef.propSetMap.label;
        this.parseParams();
    }

    /**
     * Does the % expansion of simple values, as the data in the definition
     * does not have that done.
     * @param {*} name 
     */
    dereferenceData(name) {
        if (name.startsWith('%') && name.endsWith('%')) {
            return this.omniJsonData[name.substr(1, name.length-2)];
        }
        return name;
    }

    derefernceAndSplit(name) {
        let value = this.dereferenceData(name);
        if (typeof(value) === "string") {
            if (value.includes(',')) {
                return value.split(',');
            }
            return [ value ];
        }
        return value;
    }

    /**
     * Get the parameters for the LWC which have been pased in from the OmniScript as metadata
     * The parameters are passed in the definition of the element, and are held in an unordered
     * array called customAttributes.  Each element of the array is an object which has a key:value
     * pair.  The key is called "name", while the value is called "source".
     * 
     * We loop through the array, comparing the name to things we're looking for and, when matched,
     * saving the value into a module level variable for reference elsewhere. 
     */

    parseParams() {

        let params = this.omniJsonDef.propSetMap.customAttributes;

        //  Find the values in the list (don't want to be fussy about the order)
        params.forEach((val) => {
            if (val.name.toUpperCase() === "CHARTTYPE") {
                this.params_chartType = this.dereferenceData(val.source);
            }

            if (val.name.toUpperCase() === "TITLE") {
                this.params_title = this.dereferenceData(val.source);
            }

            if (val.name.toUpperCase() === "OPTIONS") {
                this.params_options = this.dereferenceData(val.source);
            }

            if (val.name.toUpperCase() === 'LABELS') {
                this.params_labels = this.derefernceAndSplit(val.source);
                console.log("Labels: " + JSON.stringify(this.params_labels));
            }

            if (val.name.toUpperCase() === 'DATA') {
                this.params_sourceData = this.omniJsonData[val.source];
                console.log("Source Data: " + JSON.stringify(this.params_sourceData));
            }

        });

    }

    /*  *****************************************************************   */
    /*  Charting Logic                                                      */
    /*  *****************************************************************   */

    renderedCallback() {
        if (this.chartjsInitialized) {
            this.drawchart();
        }
        this.chartjsInitialized = true;

        let resourceUrl = "/resource/chartzip";
        Promise.all([
            loadScript(this, resourceUrl + "/Chart.js"),
            loadStyle(this, resourceUrl + "/Chart.css")
        ])
        .then(() => {
            // disable Chart.js CSS injection as needed by Salesforce
            window.Chart.platform.disableCSSInjection = true;
            this.drawchart();
        })
        .catch((error) => {
            this.error = error;
        });
    }

    drawchart() {

        let config = {
            type: this.params_chartType,
            data: {
                datasets: [
                    {
                        data: this.params_sourceData,
                        backgroundColor: this.params_background,
                        label: this.params_title
                    }
                ],
                labels: this.params_labels
            },
            options: this.params_options
        };
    

        const canvas = document.createElement('canvas');
        this.template.querySelector('div.chart').appendChild(canvas);
        const ctx = canvas.getContext('2d');
        this.chart = new window.Chart(ctx, config);
        this.chartDrawn = true;

    }
}