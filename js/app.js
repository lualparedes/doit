(function(){

"use strict";

/*

- Show/hide player information

- Card (regular)
    - Close
    - Show more info
    - Mark as done
        - Update stuff (progress, score)
        - Fire notifications

- Modal
    - Display
    - Choose option
    - Hide

- Task
    - id (a simple timestamp)
    - description
    - level
    - status
    - children (if any)


*/


// Cleaner aliases
var g = function (selector) {
    return document.querySelector(selector);
};
EventTarget.prototype.on = EventTarget.prototype.addEventListener;


function slideToggle(el) {
    var targetHeight = window.getComputedStyle(el).height;
    if (el.offsetHeight === 0) {
        el.style.display = "flex";
        el.style.maxHeight = 0;
        el.style.transition = "all ease .35s";
        setTimeout(function(){
            el.style.maxHeight = targetHeight;
        }, 100);
    } else {
        el.style.transition = "all ease .35s";
        el.style.maxHeight = 0;
        setTimeout(function(){
            el.style.display = "";
        }, 350);
    }
}


g(".js-showMore").on("click", function () {
    slideToggle(g(".header-user"));
});

// Add new task
// ¨¨¨¨¨¨¨¨¨¨¨¨

// Delete task
// ¨¨¨¨¨¨¨¨¨¨¨

// Edit task
// ¨¨¨¨¨¨¨¨¨

// Calculate progress
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨

})()