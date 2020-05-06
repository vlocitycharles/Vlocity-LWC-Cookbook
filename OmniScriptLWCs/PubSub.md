# PubSub

This is a simple example that shows a button that, when clicked, publishes a message that is received by a simple label.  This shows how two separate custom LWCs can communicate with each other inside of an OmniScript.

The UI design is simple.  There's a button, a horizontal line, and a label.  The button and the label are custom LWCs. 

<img src="../images/pubsub01.png" alt="pubsub01" style="zoom:50%;" />

 Click the button, and it sends the current date and time to the label:

<img src="../images/pubsub02.png" alt="pubsub02" style="zoom:50%;" />

## Components

There are three components that make up this demo:

* pubsub: This is a javascript only component that implements the publish and subscribe mechanism
* pubber: This is a variation of TinyButton that publishes the current date and time when the button is clicked.
* subber: This is a simple label that receives the date and updates a reactive property.



## Other Notes

The OmniScript which demonstrates this looks like this:

![pubsub03](../images/pubsub03.png)