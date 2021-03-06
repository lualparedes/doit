(function (){

"use strict";

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

// Clone object
// ¨¨¨¨¨¨¨¨¨¨¨¨
// Create a copy (value not reference) of an existing object. Object.assign()
// works similarly, but it passes inner objects by reference.
function clone(object) {
    if ( Object.entries(object).length > 100 ) {
        console.warn(
            "This method might not be optimal for the size of the object"
        );
    }
    return JSON.parse(JSON.stringify(object));;
}

// Convert formated string to date
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
// Used to convert a **properly formatted** string to a date object
function toDate(formatedString) {
    return new Date(formatedString);
}

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

var tasks,
    tasksDone,
    appConfig,
    appState,
    gameState,
    lastReset;

if ( localStorage.length === 0 ) {

    // Tasks to do
    // ¨¨¨¨¨¨¨¨¨¨¨
    // An array containing all tasks that still need to be done. Every single 
    // new task gets pushed here.
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
    // [2] The weight of the task in terms of how much of the total work to do 
    //     it represents. It ranges from 0 to 1. 
    // [3] The **net** sum of all the progress achieved by each **separate**
    //     main task. This sum can be greater than 100% since local progress is
    //     calculated with respect to each main task, thus if, for instance, two 
    //     main tasks have been completed, then the sum will be 200.
    // [4] The real global progress (netLocalProgressSum*taskWeight).
    var appState = {
        taskCount: 0, // [1]
        taskWeight: 0, // [2]
        netLocalProgressSum: 0, // [3]
        globalProgress: 0 // [4]
    };

    // Game state
    // ¨¨¨¨¨¨¨¨¨¨
    // Information about game stats.
    // @notes
    // [1] All the score acumulated since the user started playing.
    // [2] The health value has the [0,100] range. It remains untouched during 
    //     this frist version of the app, although the idea is to decrease it 
    //     whenever the user misses a deadline (which is another feature that 
    //     needs to be added). If the health reaches 0 the XP value gets lowered.
    // [3] Every main task done adds 1 to this value, and it gets reseted at the 
    //     end of each day (thus the difference with XP).
    var gameState = {
        xp: 0, // [1]
        health: 100, // [2]
        score: 0 // [3]
    };
    
    // Last reset
    // ¨¨¨¨¨¨¨¨¨¨
    // Done tasks only count for the progress of their day of completion (to 
    // keep being productive everyday). For this reason, it is necessary to 
    // reset tasksDone, gameState.score, and appState. 
    // lastReset will store the date of the last time the app performs this 
    // operation, so that values only get reseted at most once per day.
    var lastReset = new Date();

    localStorage.setItem("tasks",     JSON.stringify(tasks));    
    localStorage.setItem("tasksDone", JSON.stringify(tasksDone));    
    localStorage.setItem("appConfig", JSON.stringify(appConfig));
    localStorage.setItem("appState",  JSON.stringify(appState));    
    localStorage.setItem("gameState", JSON.stringify(gameState));
    localStorage.setItem("lastReset", JSON.stringify(lastReset));

}

// =============================================================================
//                  ⚠️⚠️⚠️ CAUTION / ATENCIÓN / ACHTUNG ⚠️⚠️⚠️
// =============================================================================
// THESE VALUES ONLY SERVE TO RETRIEVE, NOT TO UPDATE, SINCE THE ONLY WAY TO DO
// THAT IS THROUGH localStorage.setItem()
tasks     = JSON.parse( localStorage.getItem("tasks") );
tasksDone = JSON.parse( localStorage.getItem("tasksDone") );
appConfig = JSON.parse( localStorage.getItem("appConfig") );
appState  = JSON.parse( localStorage.getItem("appState") );
gameState = JSON.parse( localStorage.getItem("gameState") );
lastReset = toDate( JSON.parse( localStorage.getItem("lastReset") ) );



(function(){

///////////////////////
// UI INITIALIZATION //
///////////////////////_________________________________________________________

(function init(){

    updateGlobalProgress(appState);

    (function showTasks() {
        if ( tasks.length>0 && g(".wrap").children.length===1  ) {
            var newCard;
            // go through the list and render them all
            for (var i = 0; i < tasks.length; i++) {
                newCard = createAndInsertHTMLElement(tasks[i]);  
                // set any local progress bars to their proper width
                if ( tasks[i].level === "Level 1" &&
                     tasks[i].state.progress > 0 ) {
                    newCard.querySelector(".progress")
                        .style.width = tasks[i].state.progress+"%";
                }
                // set any done subtasks with their proper style
                if ( tasks[i].level === "Level 2" &&
                     tasks[i].state.progress === 100  ) {
                    newCard.querySelector(".card")
                        .classList.toggle("card--done");
                    changeButtonStyle(newCard);
                }
            }
        }
    }());

    updateStatus();

    (function checkReset() {
        var currentDate = new Date();
        var tasksDoneDeletionCount = 0;
        // reset if the last reset wasn't today
        // @notes
        // [1] Amount of ms in a day.
        // [2] This must be evaluated in this position, because evaluating it
        //     after the first condition guarantees that 
        //     !(currentDate-lastReset > 86400000), i.e. it's been less than a
        //     a day since the last reset.
        if ( (currentDate-lastReset > 86400000) || // [1]
             (lastReset.getDate() < currentDate.getDate())  ) { // [2]

            // delete tasks in tasksDone whose date isn't todays
            for (var i = tasksDone.length - 1; i >= 0; i--) {

                if ( toDate(tasksDone[i].completionDate).getDate() !==
                     currentDate.getDate() ) {

                    tasksDone.splice( tasksDone.indexOf( tasksDone[i] ), 1);
                    localStorage.setItem("tasksDone", JSON.stringify(tasksDone));

                    tasksDoneDeletionCount++;

                }
               
            }

            // update appState, gameState, and lastReset
            appState.taskCount -= tasksDoneDeletionCount;
            appState.taskWeight = 
                appState.taskCount>0 ? 
                    1/appState.taskCount :
                    0;
            appState.netLocalProgressSum -= (100*tasksDoneDeletionCount);
            appState.globalProgress = appState.taskWeight*appState.netLocalProgressSum;
            localStorage.setItem("appState", JSON.stringify(appState));

            gameState.score = 0;
            localStorage.setItem("gameState", JSON.stringify(gameState));

            lastReset = currentDate;
            localStorage.setItem("lastReset", JSON.stringify(lastReset));

            // update UI accordingly
            updateGlobalProgress(appState);
            updateStatus();

        }
    }());

}());



//////////////////
// UI UTILITIES //
//////////////////______________________________________________________________

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

// Fading in and out
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
function fadeIn(el) {
    el.style.opacity = 0;
    el.style.display = "block";
    el.style.transition = "all .5s ease";
    
    setTimeout(function(){
        el.style.opacity = 1;
    }, 100);
}
function fadeOut(el) {
    el.style.opacity = 0;
    
    setTimeout(function(){
        el.style.display = "";
    }, 500);
}

// Modal firing/hiding
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
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

// Show notification
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
function showNotification() { 
    // show the notification gracefully
    g(".notif--points").style.display = "flex";
    g(".notif--msg").style.display = "flex";

    setTimeout(function() {

        g(".notif--points").style.opacity = "1";
        g(".notif--points").style.top = "40px";
        g(".notif--msg").style.opacity = "1";
        g(".notif--msg").style.top = "104px";

        // make the notification disappear gracefully
        setTimeout(function() {
            g(".notif--points").style.opacity = "";
            g(".notif--msg").style.opacity = "";
            setTimeout(function() {
                g(".notif--points").style.top = "";
                g(".notif--msg").style.top = "";
                g(".notif--points").style.display = "";
                g(".notif--msg").style.display = "";
            }, 350);        
        }, 1500);

    },1);
}



/////////////////////
// STATE UTILITIES //
/////////////////////___________________________________________________________

function updateAppState(invocationContext, paramsObj) {
    var aS = appState;
    var pO = paramsObj;
    switch (invocationContext) {

        case "createCard":
            aS.taskCount++;
            aS.taskWeight = 1/aS.taskCount;
            aS.globalProgress = aS.netLocalProgressSum*aS.taskWeight;
            localStorage.setItem("appState",JSON.stringify(appState));
        break;

        case "deleteMainTaskNoChildren":
            aS.taskCount--;
            aS.taskWeight = aS.taskCount>0  ?  1/aS.taskCount  :  0;
            aS.globalProgress = aS.netLocalProgressSum*aS.taskWeight;
            localStorage.setItem("appState", JSON.stringify(appState));         
        break;
    }  
    return appState;  
}
function updateLocalProgress(thisTask, parentTaskObj){
    document
        .getElementById(thisTask.parent).querySelector(".progress")
        .style.width = parentTaskObj.state.progress+"%";
}
function updateStatus(){
    g(".js-xp").innerHTML = gameState.xp;
    g(".js-health").innerHTML = gameState.health;
    g(".js-score").innerHTML = gameState.score;
}



///////////////
// HEADER UI //
///////////////_________________________________________________________________

// Toggle user info
g(".js-showMore").on("click", function () {
    slideToggle(g(".header-user"), "flex");
});



/////////////////////////////////////
// ADD NEW TASK BUTTON AND OPTIONS //
/////////////////////////////////////___________________________________________

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
    localStorage.setItem("appConfig", JSON.stringify(appConfig));
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



//////////////////
// ADD NEW TASK //
//////////////////______________________________________________________________

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
            parent: null,
            children: [],
            state: {
                progress: 0
            }
        }
        if ( newTask.level === "Level 1" ) {
            newTask.state.subtaskCount = 0;
            newTask.state.subtaskWeight = 0;
            newTask.state.subtasksDone = 0;
        }
        if ( newTask.level === "Level 2" ) { 
            makeParentageLinks(newTask); 
        }

        tasks.push(newTask);
        localStorage.setItem("tasks", JSON.stringify(tasks));

        // display the new task
        updateDisplayedTasks();
        // reset the card--add
        changeToPassive(e);
    } else {
        window.alert("You need to insert a task name");
    }    
}
function makeParentageLinks(newTask) {
    // get all the level 1 cards
    var mainCards = g(".wrap").querySelectorAll(".card--lvl1");

    if ( mainCards.length > 0 ) {                

        var lastCardKey = mainCards.length - 1;
        // get the id
        var parentTaskId = mainCards[lastCardKey].parentNode.id;
        // assign the id as parent
        newTask.parent = parentTaskId;
        // get parent task and state for comparison
        var parentTaskObj = tasks.find( 
            (item) => item.id.toString() === parentTaskId 
        );
        var prevLocalState = clone(parentTaskObj.state);
        // update its parent's children
        parentTaskObj.children.push(newTask.id);

        // update its parent's state and UI accordingly
        parentTaskObj.state.subtaskCount++;
        parentTaskObj.state.subtaskWeight = 100/parentTaskObj.state.subtaskCount;
        parentTaskObj.state.progress = 
            parentTaskObj.state.subtasksDone*parentTaskObj.state.subtaskWeight;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        updateLocalProgress(newTask, parentTaskObj);

        // update global state and UI accordingly
        appState.netLocalProgressSum = 
            appState.netLocalProgressSum 
            - prevLocalState.progress 
            + parentTaskObj.state.progress;
        appState.globalProgress = appState.netLocalProgressSum*appState.taskWeight;
        localStorage.setItem("appState", JSON.stringify(appState));
        updateGlobalProgress(appState);
        
    }
}

    

//////////////////
// RENDER TASKS //
//////////////////______________________________________________________________

function updateDisplayedTasks() {
    // check if there are any tasks (in the array tasks)
    if (tasks.length > 0) {
        // check which ones need to be rendered
        var cardsRendered = g(".wrap").children.length - 1;
        // generate the cards needed
        for (var i = cardsRendered; i < tasks.length; i++) {
            createCard(tasks[i]);
        }
    }        
}


function createAndInsertHTMLElement(task) {
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
                            <button class="actionbtn checkbutton js-markAsDone">\
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
                            <button class="actionbtn checkbutton js-markAsDone">\
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
    newCard.innerHTML = 
        newCard.innerHTML
        .replace("{{ task.name }}", task.name)
        .replace("{{ task.date.year }}", toDate(task.date).getFullYear())
        .replace("{{ task.date.month }}", "0"+(toDate(task.date).getMonth()+1))
        .replace("{{ task.date.day }}", toDate(task.date).getDate());
    
    // insert the element
    g(".wrap").insertBefore(newCard, g(".js-addCardWrap"));

    return newCard;
}
function createCard(task) {

    createAndInsertHTMLElement(task)

    // update other elements in the app if needed
    // (REMEMBER: only main tasks ("Level 1") modify taskCount and taskWeight)
    if ( task.level === "Level 1" ) {
        updateGlobalProgress(updateAppState("createCard"));
    }
}

function updateGlobalProgress(currentAppState) {
    g(".js-globalProgress").style.width = currentAppState.globalProgress+"%";
}



/////////////////////
// TASK OPERATIONS //
/////////////////////___________________________________________________________

// Event listeners
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
g(".wrap").on("click", function(e){

    // js-showTaskDetails listener
    // ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
    if ( e.target.classList.contains("js-showTaskDetails") ||
         e.target.classList.contains("icon-menu") ) {
        showTaskDetails( 
            e.target.closest(".card-wrap").querySelector(".details"),
            e.target.closest(".actionbtn")
        );
    }

    // js-deleteTask listener
    // ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
    if ( e.target.classList.contains("js-deleteTask") ||
         e.target.classList.contains("icon-delete") ) {
        askConfirmation(
            deleteTask,
            e.target.closest(".card-wrap")
        );
    }

    // js-markAsDone listener
    // ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
    if ( e.target.classList.contains("js-markAsDone") ||
         e.target.classList.contains("icon-unchecked") ||
         e.target.classList.contains("icon-check") ) {

        if ( e.target.closest(".card").classList.contains("card--done") ) {
            markAsUndone( e.target.closest(".card-wrap") );
        } else {
            markAsDone( e.target.closest(".card-wrap") );
        }

    }

});

// Task details
// ¨¨¨¨¨¨¨¨¨¨¨¨
function showTaskDetails(cardDetailsEl, cardButtonEl) {
    if ( cardDetailsEl.offsetHeight === 0 ) {
        cardButtonEl.style.background = STYLES.cBghover;
        cardButtonEl.style.color = STYLES.cText;
        slideToggle(cardDetailsEl);
    } else {
        cardButtonEl.style.background = "";
        cardButtonEl.style.color = "";
        slideToggle(cardDetailsEl);
    }
}

// Delete task
// ¨¨¨¨¨¨¨¨¨¨¨
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

  //----------------------------------------------------------------------------

    function deleteTaskObjectAndCard() {
        // delete task (in tasks array)
        tasks.splice( tasks.indexOf( thisTask ), 1 );
        localStorage.setItem("tasks", JSON.stringify(tasks));       
        // delete task card 
        taskCard.parentNode.removeChild(taskCard);               
    }

  //----------------------------------------------------------------------------

    // LEVEL 1 | NO CHILDREN
    function deleteMainTaskNoChildren() {

        deleteTaskObjectAndCard();
        updateGlobalProgress( updateAppState("deleteMainTaskNoChildren") );

    }

    // LEVEL 1 | WITH CHILDREN
    // @notes
    // [-] delete children doesn't invoke the case LEVEL 2 | WITH PARENT 
    //     for better performance
    function deleteMainTaskWithChildren() {

        // save a copy of the progress it had
        // @notes
        // [1] It is needed to avoid having to place the same conditional when
        //     appState is being updated (netLocalProgressSum)
        var prevLocalProgress = 
            thisTask.state.progress>0 ?
                clone(thisTask).state.progress:
                0; // [1]

        (function deleteChildrenSubtasks() {
            var subtasks = thisTask.children;
            var subtaskCard;
            var subtaskIndex;

            for (var i = subtasks.length - 1; i >= 0; i--) {

                // delete children subtasks' cards
                subtaskCard = document.getElementById(subtasks[i]);
                subtaskCard.parentNode.removeChild(subtaskCard);

                // delete children subtasks
                // @notes
                // [1] Subtasks never get to the tasksDone array, that's why
                //     working with tasks works in all cases
                var subtaskObj = tasks.find( (item) => item.id === subtasks[i] );
                tasks.splice( tasks.indexOf( subtaskObj ), 1); // [1]
                localStorage.setItem("tasks", JSON.stringify(tasks));              
                  
            }
        }());

        deleteTaskObjectAndCard();

        // update App State "manually" for the sake of simplicity
        appState.taskCount--;
        appState.taskWeight = 
            appState.taskCount>0  ?  1/appState.taskCount  :  0;
        appState.netLocalProgressSum-= prevLocalProgress;
        appState.globalProgress = appState.taskWeight*appState.netLocalProgressSum;
        localStorage.setItem("appState", JSON.stringify(appState));

        updateGlobalProgress(appState);

    }

  //----------------------------------------------------------------------------

    // LEVEL 2 | NO PARENT
    // [-] 🚫 update appState (not needed because it is calculated from
    //     <parentTask>.state and this task has no parent)
    // [-] 🚫 update global progress bar (not needed because it is calculated 
    //     from <parentTask>.state and this task has no parent)
    function deleteSubtaskNoParent() {
        deleteTaskObjectAndCard();
    }


    // LEVEL 2 | WITH PARENT 
    function deleteSubtaskWithParent() {

        // find its parent
        var parentTaskObj = tasks.find( (item) => item.id.toString() === thisTask.parent );

        // update its parent's children
        var levelFamily = parentTaskObj.children;
        levelFamily.splice(
            levelFamily.indexOf(
                levelFamily.find( 
                    (item) => item === thisTask.id 
                )
            ), 1
        );
        localStorage.setItem("tasks", JSON.stringify(tasks));

        // update its parent's state and UI accordingly
        // @notes
        // [1] This seems tempting to refactor, however, if you decide to do it,
        //     you'll realize that it produces several new conditionals, that 
        //     lead to spaghetti code, and will make things way harder to debug.
        //     Ergo, don't waste your time and go do something more productive.
        if ( taskCard.querySelector(".card").classList.contains("card--done") ) {

            var prevLocalState = clone(parentTaskObj.state);

            parentTaskObj.state.subtaskCount--;
            parentTaskObj.state.subtaskWeight = 
                parentTaskObj.state.subtaskCount>0 ?
                    100/parentTaskObj.state.subtaskCount :
                    0;
            parentTaskObj.state.subtasksDone--;
            parentTaskObj.state.progress = 
                parentTaskObj.state.subtasksDone*parentTaskObj.state.subtaskWeight;
            localStorage.setItem("tasks", JSON.stringify(tasks));
            updateLocalProgress(thisTask, parentTaskObj);

            // update global state and UI accordingly
            appState.netLocalProgressSum = 
                appState.netLocalProgressSum 
                - prevLocalState.progress 
                + parentTaskObj.state.progress;
            appState.globalProgress = appState.netLocalProgressSum*appState.taskWeight;
            localStorage.setItem("appState", JSON.stringify(appState));
            updateGlobalProgress(appState);

        } else {

            var prevLocalState = clone(parentTaskObj.state);

            parentTaskObj.state.subtaskCount--;
            parentTaskObj.state.subtaskWeight = 
                parentTaskObj.state.subtaskCount>0 ?
                    100/parentTaskObj.state.subtaskCount :
                    0;
            parentTaskObj.state.progress = 
                parentTaskObj.state.subtasksDone*parentTaskObj.state.subtaskWeight;
            localStorage.setItem("tasks", JSON.stringify(tasks));
            // edge case: last subtask undone (in a group of several subtasks)
            if ( parentTaskObj.state.progress === 100 ) {
                // the idea is to fire the case doneMainTaskWithChildren()
                markAsDone( document.getElementById(parentTaskObj.id) );
            } else {
                updateLocalProgress(thisTask, parentTaskObj);
            }

            // update global state and UI accordingly
            appState.netLocalProgressSum = 
                appState.netLocalProgressSum 
                - prevLocalState.progress 
                + parentTaskObj.state.progress;
            appState.globalProgress = appState.netLocalProgressSum*appState.taskWeight;
            localStorage.setItem("appState", JSON.stringify(appState));
            updateGlobalProgress(appState);

        } 

        deleteTaskObjectAndCard();

    }

  //----------------------------------------------------------------------------

    if ( thisTask.level === "Level 1" ) {

        if ( thisTask.children.length !== 0 ) {
            deleteMainTaskWithChildren();
        } else {
            deleteMainTaskNoChildren();
        }

    } else {

        if ( thisTask.parent !== null ) {
            deleteSubtaskWithParent();
        } else {
            deleteSubtaskNoParent();
        }

    }

}

// Mark as done 
// ¨¨¨¨¨¨¨¨¨¨¨¨
function changeButtonStyle(taskCard) {
    taskCard.querySelector(".js-markAsDone span").classList.toggle("icon-unchecked");
    taskCard.querySelector(".js-markAsDone span").classList.toggle("icon-check");
}

function markAsDone(taskCard) {

    var thisTask = tasks.find( (item) => item.id.toString() === taskCard.id );    

  //----------------------------------------------------------------------------

    // LEVEL 1 | NO CHILDREN
    function doneMainTaskNoChildren(invokedDirectly) {

        changeButtonStyle(taskCard);

        // update this task object
        thisTask.state.progress = 100;    

        // update global tasks data structures
        thisTask.completionDate = new Date();
        tasksDone.push(thisTask);
        localStorage.setItem("tasksDone", JSON.stringify(tasksDone));
        tasks.splice( tasks.indexOf( thisTask ), 1 );

        localStorage.setItem("tasks", JSON.stringify(tasks));

        // update UI elements linked to the card
        taskCard.querySelector(".progress").style.width = "100%";

        taskCard.style.opacity = 0;
        setTimeout(function() {
            taskCard.parentNode.removeChild(taskCard); 
        }, 850);
        
        showNotification();

        // Update global states
        gameState.xp++;
        gameState.score++;
        localStorage.setItem("gameState", JSON.stringify(gameState));
        
        if ( invokedDirectly ) {
            // this is made to prevent re-adding the progress when the direct
            // caller isn't markAsDone(). Such cases are:
            // [1] doneSubtaskWithParent() → doneMainTaskWithChildren() →
            //     → (two closures) → here 
            // [2] updateLocalState() → markAsDone → doneSubtaskWithParent()...            
            appState.netLocalProgressSum += thisTask.state.progress;
            appState.globalProgress = appState.netLocalProgressSum*appState.taskWeight;
            localStorage.setItem("appState", JSON.stringify(appState));
        }
        
        // Update global UI
        updateStatus();
        updateGlobalProgress(appState);
    }

    // LEVEL 1 | WITH CHILDREN
    function doneMainTaskWithChildren() {

        // remove children subtasks from both data structures and the UI
        (function doneChildrenSubtasks() {
            var subtasks = thisTask.children;
            var i = subtasks.length - 1;
            var subtaskCard;

            function doneEachChildrenSubtask() { 

                if ( i >=0 ) {

                    // delete children subtasks' cards
                    // @notes
                    // [1] Keep it at 50ms to avouid errors caused by cycles
                    //     overlaping
                    subtaskCard = document.getElementById(subtasks[i]);
                    subtaskCard.style.transition = "all .25s ease";
                    subtaskCard.style.transform = "scale(0,0)";
                    setTimeout(function() {
                        subtaskCard.parentNode.removeChild(subtaskCard);
                    },50); // [1]

                    // delete children subtasks
                    // @notes
                    // [1] Remember subtasks never get to the tasksDone array
                    //     because there's no use in that. Thus, they're always 
                    //     found in the tasks array.
                    tasks.splice( 
                        tasks.indexOf( 
                            tasks.find( 
                                (item) => item.id === subtasks[i] 
                            ) 
                        )
                    , 1);
                    localStorage.setItem("tasks", JSON.stringify(tasks)); 

                } else {

                    clearInterval(myInterval);

                    // [1] update this part of the global state here, since 
                    //     doneMainTaskNoChildren() only updates these appState
                    //     values when called directly from markAsDone();
                    // [2] this is also set up here because [1] values depend
                    //     on this value
                    var prevLocalState = clone(thisTask.state);
                    thisTask.state.progress = 100; // [2]
                    localStorage.setItem("tasks", JSON.stringify(tasks));
                    appState.netLocalProgressSum = 
                        appState.netLocalProgressSum 
                        - prevLocalState.progress
                        + thisTask.state.progress; // [1]
                    appState.globalProgress = 
                        appState.netLocalProgressSum*appState.taskWeight; // [1]
                    localStorage.setItem("appState", JSON.stringify(appState));

                    doneMainTaskNoChildren();

                }

                i--;                

            }

            var myInterval = setInterval(doneEachChildrenSubtask,100);

        }());   

    }

  //----------------------------------------------------------------------------

    // LEVEL 2 | NO PARENT
    // @notes
    // [-] 🚫 no need to update any progress thing
    // [-] 🚫 avoid changing it from tasks to tasksDone, since it is better to 
    //     remove it once the user hits delete
    function doneSubtaskNoParent() {
        // update UI elements linked to the card
        changeButtonStyle(taskCard);
        taskCard.querySelector(".card").classList.toggle("card--done");
        // udate subtask data structure
        thisTask.state.progress = 100;
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    // LEVEL 2 | WITH PARENT
    // @notes
    // [-] 🚫 avoid changing it from tasks to tasksDone, since it is better to 
    //     remove them all at once after their parent has been completed 
    function doneSubtaskWithParent() {

        // update UI elements linked to the card
        changeButtonStyle(taskCard);
        taskCard.querySelector(".card").classList.toggle("card--done");

        // udate subtask data structure
        thisTask.state.progress = 100;

        // update parent task data structure and UI
        var parentTaskObj = tasks.find( (item) => item.id.toString() === thisTask.parent );

        parentTaskObj.state.subtasksDone++;
        parentTaskObj.state.progress+= parentTaskObj.state.subtaskWeight;

        localStorage.setItem("tasks", JSON.stringify(tasks));

        document.getElementById(parentTaskObj.id)
            .querySelector(".progress").style.width 
            = parentTaskObj.state.progress+"%";

        // update global states
        appState.netLocalProgressSum+= parentTaskObj.state.subtaskWeight;
        appState.globalProgress = appState.netLocalProgressSum*appState.taskWeight;
        localStorage.setItem("appState", JSON.stringify(appState));

        // update global UI
        updateGlobalProgress(appState);

        // edge case: mark parent as done if it was the last child subtask
        if ( parentTaskObj.state.progress === 100 ) {
            taskCard = document.getElementById(parentTaskObj.id);
            thisTask = parentTaskObj;
            doneMainTaskWithChildren();
        }
    }

  //----------------------------------------------------------------------------

    if ( thisTask.level === "Level 1" ) {

        if ( thisTask.children.length !== 0 ) {
            doneMainTaskWithChildren();
        } else {
            doneMainTaskNoChildren(true);
        }

    } else {

        if ( thisTask.parent !== null ) {
            doneSubtaskWithParent();
        } else {
            doneSubtaskNoParent();
        }

    }

}

// Mark as undone 
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨
function markAsUndone(taskCard) {

    var thisTask = tasks.find( (item) => item.id.toString() === taskCard.id );

  //----------------------------------------------------------------------------

    // LEVEL 2 | NO PARENT
    function undoneSubtaskNoParent() {
        // update UI elements linked to the card
        changeButtonStyle(taskCard);
        taskCard.querySelector(".card").classList.toggle("card--done");
        // udate subtask data structure
        thisTask.state.progress = 0;
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    // LEVEL 2 | WITH PARENT
    function undoneSubtaskWithParent() {

        // update UI elements linked to the card
        changeButtonStyle(taskCard);
        taskCard.querySelector(".card").classList.toggle("card--done");

        // udate subtask data structure
        thisTask.state.progress = 0;

        // update parent task data structure and UI
        var parentTaskObj = tasks.find( (item) => item.id.toString() === thisTask.parent );

        parentTaskObj.state.subtasksDone--;
        parentTaskObj.state.progress-= parentTaskObj.state.subtaskWeight;

        localStorage.setItem("tasks", JSON.stringify(tasks));

        document.getElementById(parentTaskObj.id)
            .querySelector(".progress").style.width 
            = parentTaskObj.state.progress+"%";

        // update global states
        appState.netLocalProgressSum-= parentTaskObj.state.subtaskWeight;
        appState.globalProgress = appState.netLocalProgressSum*appState.taskWeight;
        localStorage.setItem("appState", JSON.stringify(appState));

        // update global UI
        updateGlobalProgress(appState);

    }

  //----------------------------------------------------------------------------

    if ( thisTask.parent !== null ) {
        undoneSubtaskWithParent();
    } else {
        undoneSubtaskNoParent();
    }

}

}())
// for debugging purposes
// just add var <id> = this function at the beginning 
/*
var o = {
    "tasks": tasks,
    "tasksDone": tasksDone,
    "appConfig": appConfig,
    "appState": appState,
    "gameState": gameState,
    "lastReset": lastReset
};

return o;*/
}());
