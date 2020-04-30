# Tiny Button

[This LWC](tinyButton) has a small UI foot print and behaves somewhat like a set values.  It is intended mostly as a base to start building from, but gives you enough hooks to use as examples.

It does three things:

1. It copies the Field Label from the Custom LWC element (*Me Me Me!*) to the label of the button in the UI.
2. It sets the value of the element to an object containing "A" and "B" values.
3. It sets a free-floating value in the data JSON of ["HeyHowdy" to "Hey"](https://www.youtube.com/watch?v=G7X6vPIsE_g).

Here's an example of how it's been added to an OmniScript:

![tinybutton01](../images/tinybutton01.png)

You can see the field label specified as Me Me Me!, and how it gets rendered in the UI:

![](../images/tinybutton02.png)

This screenshot was taken after it was clicked, and you can see two elements have been set in the data JSON.  The first is Step1.TinyButtonLWC, and the second is HeyHowdy.  These were set in the handler for the on click event on the button:

```    javascript
handleClick(event) {
  //  Set the value of the button in the data JSON (without really knowing "who" I am)
  this.omniUpdateDataJson({"A": "AA", "B":"BB"});

  //  Set some values explicitly in the data JSON
  this.omniApplyCallResp({"HeyHowdy": "Hey"});
}
```



