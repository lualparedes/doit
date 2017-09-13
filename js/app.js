/*

- Show/hide player information

----------------------------------------------

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

//////////////////
// GLOBAL STUFF //
//////////////////______________________________________________________________

// Cleaner aliases
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
// Just a few more elegant identifiers for common DOM API methods
var g = function (selector) {
    return document.querySelector(selector);
};
EventTarget.prototype.on = EventTarget.prototype.addEventListener;
EventTarget.prototype.off = EventTarget.prototype.removeEventListener;

// Style variables
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
// A copy of useful variables in the _variables.scss partial
var STYLES = {
    // Colors
    cBg: "#f9f9f9",
    cText: "#333",
    cSelection: "#ccc",

    cBorder: "#b3b3b3",
    cBghover: "#e6e6e6",
    cBackdrop: "rgba(0,0,0,0.5)",
    cAccent: "#fc9e9b"
}

// Important data
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨
// Data structures for global information
var tasks = [];



(function(){

"use strict";

///////////////
// UTILITIES //
///////////////_________________________________________________________________

// Slide Toggle
// ¨¨¨¨¨¨¨¨¨¨¨¨
// Works similar to jQuery's
function slideToggle(el, display, time) {
    var targetDisplay = display || "block";
    var targetHeight = window.getComputedStyle(el).height;
        targetHeight === "auto" ? 
        targetHeight = "1000px" : 
        targetHeight = targetHeight;
    var duration = time || .25;

    if (el.offsetHeight === 0) {
        el.style.display = targetDisplay;
        el.style.maxHeight = 0;
        el.style.transition = "all ease "+duration+"s";
        setTimeout(function(){
            el.style.maxHeight = targetHeight;
        }, 100);
    } else {
        el.style.transition = "all ease "+duration+"s";
        el.style.maxHeight = 0;
        setTimeout(function(){
            el.style.display = "";
        }, duration*1000);
    }
}



///////////////
// HEADER UI //
///////////////_________________________________________________________________

// Toggle user info
g(".js-showMore").on("click", function () {
    slideToggle(g(".header-user"), "flex");
});



//////////////////
// ADD NEW TASK //
//////////////////______________________________________________________________

// Useful markup
var TASK_NAME = {
    init:  '<span class="icon-add"> </span>Add new task...</div>',
    active: '<input type="text" class="in" placeholder="Task...">'
}
var TASK_BUTTONS = {
    init:  '<button class="actionbtn js-showDetails">\
                <span class="icon-config"></span>\
            </button>',
    active: '<button class="actionbtn actionbtn--add js-addTask">\
                <span class="icon-add"></span>\
            </button>\
            <button class="actionbtn js-cancel">\
                <span class="icon-delete"></span>\
            </button>'
}
var TASK_DETAILS = {
    init:  '<div class="detail">\
                <div class="detail__key">Default level</div>\
                <div class="detail__value detail__value--mutable">\
                    <select class="levels">\
                        <option>Level 1</option>\
                        <option>Level 2</option>\
                    </select>\
                </div>\
            </div>',
    active: '<div class="detail">\
                <div class="detail__key">Level</div>\
                <div class="detail__value detail__value--mutable">\
                    <select class="levels">\
                        <option>Level 1</option>\
                        <option>Level 2</option>\
                    </select>\
                </div>\
            </div>'
}

// show default details
function toggleDetails(e) {
    var details = g(".card--add .details");
    // when hidden
    if ( details.offsetHeight === 0 ) {
        // change the style of the button
        this.style.background = STYLES.cBghover;
        this.style.color = STYLES.cText;
        // display the details
        slideToggle(details, null, .1);
    } else {
        // change the style of the button
        this.style.background = "";
        this.style.color = "";
        // hide the details
        slideToggle(details, null, .1);
    }  
    e.stopPropagation(); 
}
g(".card--add .js-showDetails").on("click", toggleDetails);

// modify default details
function changeDefaultLevel() {
    // get the selected option
    var defaultIndex = this.options.selectedIndex;
    // set this option to be the default selection
    var options = this.children;
    for (var i = options.length - 1; i >= 0; i--) {
        options[i].removeAttribute("selected");
    }
    this.children[defaultIndex].setAttribute("selected","selected");
}
g(".card--add .detail .levels").on("change", changeDefaultLevel);

// change to active state
function changeToActive(){  
    // change background
    g(".card--add").classList.toggle("is-active");
    // change the task "content"
    g(".task__name--add").innerHTML = TASK_NAME.active;
    g(".task__name--add").classList.toggle("is-active");
    // change buttons
    g(".task__buttons").innerHTML = TASK_BUTTONS.active;

    // change and show details
    function updateDetails() {
        g(".card--add .details").innerHTML = TASK_DETAILS.active;
        slideToggle(g(".card--add .details"), null, .1);
    }
    if ( g(".card--add .details").offsetHeight !== 0 ) {
        // prevent weird stuff if the user is checking the defaults
        slideToggle(g(".card--add .details"), null, .1);
        setTimeout(updateDetails, 100);
    } else {
        updateDetails();
    }

    // prevent new calls
    g(".task--add").off("click", changeToActive);

    // add needed event listeners
    g(".js-addTask").on("click", createTask);
    g(".js-cancel").on("click", changeToPassive);
}
g(".task--add").on("click", changeToActive);

// change to pasive state (cancel adding new task)
function changeToPassive(e) {
    // change background
    g(".card--add").classList.toggle("is-active");

    // change the task "content"
    g(".task__name--add").innerHTML = TASK_NAME.init;
    g(".task__name--add").classList.toggle("is-active");
    // change buttons
    g(".task__buttons").innerHTML = TASK_BUTTONS.init;

    // change and hide details
    g(".card--add .details").innerHTML = TASK_DETAILS.init;
    slideToggle(g(".card--add .details"), null, .1);

    // add needed event listeners
    g(".card--add .detail .levels").on("change", changeDefaultLevel);
    g(".card--add .js-showDetails").on("click", toggleDetails);

    // prevent crazy stuff
    e.stopPropagation();
    // allow new calls
    g(".task--add").on("click", changeToActive);
}

// add new task
function createTask() {
    // check if input is valid
    if (g(".task__name--add .in").value !== "") {
        // create the object
        var newTask = {
            id: Date.now(),
            name: g(".task__name--add .in").value,
            level: g(".card--add .levels").value,
            parent: null,
            children: []
        }
        tasks.push(newTask);
        // display the new task
        // reset the card--add
        resetAddCard();
    } else {
        window.alert("You need to insert a task name");
    }    
}

function resetAddCard() {
    console.log(tasks);
}
    


// Render new task
// ¨¨¨¨¨¨¨¨¨¨¨¨

// Delete task
// ¨¨¨¨¨¨¨¨¨¨¨

// Edit task
// ¨¨¨¨¨¨¨¨¨

// Calculate progress
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨

})()