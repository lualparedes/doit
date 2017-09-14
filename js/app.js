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

// Polyfills
// ¨¨¨¨¨¨¨¨¨
// @author: MDN Element.closest Reference Page
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
}
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        var ancestor = this;
        if (!document.documentElement.contains(el)) return null;
        do {
            if (ancestor.matches(s)) return ancestor;
            ancestor = ancestor.parentElement;
        } while (ancestor !== null); 
        return null;
    };
}


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



////////////////////////////
// GLOBAL DATA STRUCTURES //
////////////////////////////____________________________________________________

// Tasks to do
// ¨¨¨¨¨¨¨¨¨¨¨
// An array containing all tasks that still need to be done. Every single new
// task gets pushed here.
var tasks = [];

// Tasks done
// ¨¨¨¨¨¨¨¨¨¨
// An array containing all tasks that were completed during the day. It gets 
// reset every day at 0000.
var tasksDone = [];

// App configuration
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
// @notes
// [1] 0 = "Level 1", 1 = "Level 2", etc.
var appConfig = {
    defaultLevel: 0 // [1]
};

// App state
// ¨¨¨¨¨¨¨¨¨
// Object holding useful information about the state of the app. Using this
// object prevents you from having to execute loops to check items.
// @notes
// [1] Number of main tasks ("Level 1" tasks).
// [2] The weight of the task in terms of how much of the total work to do it 
//     represents. 
// [3] The **net** sum of all the progress achieved by each **separate**
//     main task. This sum can be greater than 100% since local progress is
//     calculated with respect to each main task, thus if, for instance, two 
//     main tasks have been completed, then the sum will be 200.
// [4] The real global progress (netLocalProgressSum*taskWeight)
//
// think about when this object gets created
//
var appState = {
    taskCount: 0, // [1]
    taskWeight: 0, // [2]
    netLocalProgressSum: 0, // [3]
    globalProgress: 0 // [4]
};



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

// Fade in
// ¨¨¨¨¨¨¨
function fadeIn(el) {
    el.style.opacity = 0;
    el.style.display = "block";
    el.style.transition = "all .5s ease";
    
    setTimeout(function(){
        el.style.opacity = 1;
    }, 100);
}

// Fade out
// ¨¨¨¨¨¨¨¨
function fadeOut(el) {
    el.style.opacity = 0;
    
    setTimeout(function(){
        el.style.display = "";
    }, 500);
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
            <button class="actionbtn js-addCancel">\
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
        // make sure that the details are updated
        updateDefaultLevel();
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
    appConfig.defaultLevel = defaultIndex;
    // update the UI
    var options = this.children;
    for (var i = options.length - 1; i >= 0; i--) {
        options[i].removeAttribute("selected");
    }
    updateDefaultLevel();
}
g(".card--add .detail .levels").on("change", changeDefaultLevel);
// update UI if default level has changed
function updateDefaultLevel() {
    if (appConfig.defaultLevel !== 0) {
        g(".card--add .detail .levels")
            .children[appConfig.defaultLevel]
            .setAttribute("selected","selected");
    }
}

// change to active state
function changeToActive(){  
    // change background
    g(".card--add").classList.toggle("is-active");
    // change the task "content"
    g(".task__name--add").innerHTML = TASK_NAME.active;
    g(".task__name--add").classList.toggle("is-active");
    // change buttons
    g(".card--add .task__buttons").innerHTML = TASK_BUTTONS.active;

    // change and show details
    function updateDetails() {
        g(".card--add .details").innerHTML = TASK_DETAILS.active;
        slideToggle(g(".card--add .details"), null, .1);
        // update default level if needed
        updateDefaultLevel();
    }
    if ( g(".card--add .details").offsetHeight !== 0 ) {
        // prevent weird stuff if the user is checking the defaults
        slideToggle(g(".card--add .details"), null, .1);
        setTimeout(updateDetails, 100);
    } else {
        updateDetails();
    }

    // focus on the input
    g(".task--add .in").focus();

    // prevent new calls
    g(".task--add").off("click", changeToActive);

    // add needed event listeners
    g(".js-addTask").on("click", createTask);
    g(".task--add .in").on("keydown", function(e){
        // pressing enter = clicking on create task button
        if (e.which === 13) {
            g(".js-addTask").click();
        }
    });
    g(".js-addCancel").on("click", changeToPassive);
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
    g(".card--add .task__buttons").innerHTML = TASK_BUTTONS.init;

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
function createTask(e) {
    // check if input is valid
    if (g(".task__name--add .in").value !== "") {
        // create the object
        var newTask = {
            id: Date.now(),
            date: new Date(),
            name: g(".task__name--add .in").value,
            level: g(".card--add .levels").value,
            progress: 0,
            parent: null,
            children: []
        }
        tasks.push(newTask);
        // display the new task
        updateDisplayedTasks();
        // reset the card--add
        changeToPassive(e);
    } else {
        window.alert("You need to insert a task name");
    }    
}
    

//////////////////
// RENDER TASKS //
//////////////////______________________________________________________________

function updateDisplayedTasks() {
    // check if there are any tasks (in the array tasks)
    if (tasks.length > 0) {
        // if no task has been rendered in a card
        if ( g(".wrap").children.length === 1 ) {
            // go through the list and render them all
            for (var i = 0; i < tasks.length; i++) {
                createCard(tasks[i]);
            }
        } else {
            // check which ones need to be rendered
            var cardsRendered = g(".wrap").children.length - 1;
            // generate the cards needed
            for (var i = cardsRendered; i < tasks.length; i++) {
                createCard(tasks[i]);
            }
        }
    }        
}

function createCard(task) {
    // useful markup
    var CARD_MARKUP = {
        lvl1:  '<div class="card card--lvl1">\
                    <div class="task">\
                        <div class="task__name">{{ task.name }}</div>\
                        <div class="task__buttons">\
                            <button class="actionbtn js-showTaskDetails">\
                                <span class="icon-menu"></span>\
                            </button>\
                            <button class="actionbtn js-deleteTask">\
                                <span class="icon-delete"></span>\
                            </button>\
                            <button class="actionbtn checkbutton js-doneTask">\
                                <span class="icon-unchecked"></span>\
                            </button>\
                        </div>\
                        <div class="bar--task">\
                            <div class="progress progress--progress"></div>\
                        </div>\
                    </div>\
                    <div class="details">\
                        <div class="detail">\
                            <div class="detail__key">Added</div>\
                            <div class="detail__value">\
                            <span class="_align-date">{{ task.date.year }}</span>/&nbsp;\
                            <span class="_align-date">{{ task.date.month }}</span> /&nbsp;{{ task.date.day }}</div>\
                        </div>\
                    </div>\
                </div>',
        lvl2:  '<div class="card-edge card-edge--lvl2">\
                    <span class="card-edge__middle-edge"></span>\
                </div>\
                <div class="card card--lvl2">\
                    <div class="task">\
                        <div class="task__name">{{ task.name }}</div>\
                        <div class="task__buttons js-showTaskDetails">\
                            <button class="actionbtn">\
                                <span class="icon-menu"></span>\
                            </button>\
                            <button class="actionbtn js-deleteTask">\
                                <span class="icon-delete"></span>\
                            </button>\
                            <button class="actionbtn checkbutton js-doneTask">\
                                <span class="icon-unchecked"></span>\
                            </button>\
                        </div>\
                    </div>\
                    <div class="details">\
                        <div class="detail">\
                            <div class="detail__key">Added</div>\
                            <div class="detail__value"><span class="_align-date">{{ task.date.year }}</span>/&nbsp;\
                            <span class="_align-date">{{ task.date.month }}</span> /&nbsp;{{ task.date.day }}</div>\
                        </div>\
                    </div>\
                </div>'
    }

    // create the element
    var newCard = document.createElement("div");
    newCard.setAttribute("class","card-wrap");
    newCard.setAttribute("id", task.id);
    task.level === "Level 1" ?
        newCard.innerHTML = CARD_MARKUP.lvl1 :
        newCard.innerHTML = CARD_MARKUP.lvl2;

    // populate the element
    newCard.innerHTML = newCard.innerHTML
                        .replace("{{ task.name }}", task.name)
                        .replace("{{ task.date.year }}", task.date.getFullYear())
                        .replace("{{ task.date.month }}", "0"+(task.date.getMonth()+1))
                        .replace("{{ task.date.day }}", task.date.getDate());
    
    // insert the element
    g(".wrap").insertBefore(newCard, g(".js-addCardWrap"));

    // update other elements in the app if needed
    // (REMEMBER: only main tasks ("Level 1") modify taskCount and taskWeight)
    if ( task.level === "Level 1" ) {
        updateGlobalProgress(updateAppState("createCard"));
    }
}

function updateGlobalProgress(currentAppState) {
    g(".js-globalProgress").style.width = currentAppState.globalProgress;
}



/////////////////////
// TASK OPERATIONS //
/////////////////////___________________________________________________________

// Delete task
// ¨¨¨¨¨¨¨¨¨¨¨
g(".wrap").on("click", function(e){

    // js-deleteTask listener
    // ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
    if ( e.target.classList.contains("js-deleteTask") ||
         e.target.classList.contains("icon-delete") ) {
        askConfirmation(
            deleteTask,
            e.target.closest(".card-wrap")
        );
    }

});

function askConfirmation(callback, callbackParams) {
    openModal();
    g(".modal").onclick = function(e){
        // onclick was used instead of addEventListener() because it overwrites
        // any listeners already attached to click. Using addEventListener()
        // results in adding the same thing over and over again, which makes 
        // callback() and closeModal() run several times instead of only once.
        //
        // On the other hand, this assignation is repeated every time 
        // askConfirmation() is invoked, to allow its reutilization with a 
        // different callback.
        if ( e.target.classList.contains("js-ok") ) {
            callback(callbackParams);
            closeModal();
        } else if ( e.target.classList.contains("js-cancel") ) {
            closeModal();
        }
    };
}

function deleteTask(taskCard) {
    
    var thisTask = tasks.find( (item) => item.id.toString() === taskCard.id );

    // delete task (in tasks array)
    tasks.splice( tasks.indexOf( thisTask ), 1 );       
    // delete task card 
    taskCard.parentNode.removeChild(taskCard);

    if ( thisTask.children.length !== 0 ) {
        // delete children subtasks
        console.log("holi", tasks);
        // delete children subtasks' cards 
    }

    // update appState
    updateAppState("deleteTask", { "thisTask": thisTask });
    
    // update the rest of the UI (according to appState)
}

function updateAppState(invocationContext, paramsObj) {
    var aS = appState;
    var pO = paramsObj;
    switch (invocationContext) {

        case "createCard":
            aS.taskCount++;
            aS.taskWeight = 1/aS.taskCount;
            aS.globalProgress = aS.netLocalProgressSum*aS.taskWeight;
            return appState;

        case "deleteTask":
            // console.log("before",aS);
            if ( pO.thisTask.level === "Level 1") {
                aS.taskCount--;
                aS.taskWeight = aS.taskCount > 0 ? 1/aS.taskCount : 0;
            }            
            aS.netLocalProgressSum = 
                pO.thisTask.progress !== 0 ? // check this condition when dealing with level 2
                    aS.netLocalProgressSum - pO.thisTask.progress : 
                    aS.netLocalProgressSum;
            aS.globalProgress = aS.netLocalProgressSum*aS.taskWeight;
            // console.log("after",aS);

    }    
}

function openModal() {
    // show the backdrop...
    fadeIn(g(".backdrop"));
    // ...and the modal itself
    g(".modal").style.transition = "all .25s ease";
    setTimeout(function(){
        g(".modal").style.transform = "translate(-50%, -50%) scale(1,1)";
    }, 100);
}
function closeModal() {
    // close the modal itself...
    g(".modal").style.transform = "";
    // ...and the backdrop
    setTimeout(function(){
        fadeOut(g(".backdrop"));
    }, 150);        
}



// Task details
// ¨¨¨¨¨¨¨¨¨¨¨¨

// every task completed must contain the date of completion
// sub-tasks don't affect directly the global progress bar (they affect the
// progress bar of the parent task)

// Mark as done (main)
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
// points

// Mark as done (subtask)
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
// local progress
// points



///////////////
///////////////
///////////////_________________________________________________________________
/*

- How to stablish parent-children relationships in tasks
- draganddrop
- localStorage



*/


})()