(function(){

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

// Game state
// ¨¨¨¨¨¨¨¨¨¨
// Information about game stats.
// @notes
// [1] All the score acumulated since the user started playing.
// [2] The health value has the [0,100] range. It remains untouched during this
//     frist version of the app, although the idea is to decrease it whenever
//     the user misses a deadline (which is another feature that needs to be
//     added). If the health reaches 0 the XP value gets lowered.
// [3] Every main task done adds 1 to this value, and it gets reseted at the end
//     of each day (thus the difference with XP).
var gameState = {
    xp: 0, // [1]
    health: 100, // [2]
    score: 0 // [3]
};



(function(){

///////////////
// UTILITIES //
///////////////_________________________________________________________________

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
                g(".notif").style.display = "";
            }, 350);        
        }, 1500);

    },1);
    

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
        // get parent task
        var parentTaskObj = tasks.find( 
            (item) => item.id.toString() === parentTaskId 
        );
        // update its parent's children
        parentTaskObj.children.push(newTask.id);
        // update its parent's state and update global state and UI accordingly

        //console.log("Add: before");
        //console.log(parentTaskObj.state);
        updateGlobalProgress(
            updateAppState(
                "updateLocalState", 
                updateLocalState(parentTaskObj, newTask, "createTask")
            )
        );
        //console.log("Add: after");
        //console.log(parentTaskObj.state);
        
    }
}

function updateAppState(invocationContext, paramsObj) {
    var aS = appState;
    var pO = paramsObj;
    switch (invocationContext) {

        case "createCard":
            aS.taskCount++;
            aS.taskWeight = 1/aS.taskCount;
            aS.globalProgress = aS.netLocalProgressSum*aS.taskWeight;
        break;

        case "updateLocalState":
            aS.netLocalProgressSum -= pO.prevLocalProgress;
            aS.netLocalProgressSum += pO.localProgress;
            aS.globalProgress = aS.netLocalProgressSum*aS.taskWeight;
        break;

        case "deleteMainTaskNoChildren":
            aS.taskCount--;
            aS.taskWeight = aS.taskCount>0  ?  100/aS.taskCount  :  0;
            aS.globalProgress = aS.netLocalProgressSum*aS.taskWeight;            
        break;
    }  
    return appState;  
}



// ====================================================
// ⚠️⚠️⚠️ RE-TEST WHEN MARK AS DONE HAS BEEN ADDED ⚠️⚠️⚠️
// ====================================================
function updateLocalState(parentTaskObj, thisTask, operationType){
    // save a copy of the parent's state for future comparissons
    var prevLocalState = clone(parentTaskObj.state);

    // update the parent's state object
    switch (operationType) {
        case "createTask":
            parentTaskObj.state.subtaskCount++;
        break;
        case "deleteSubtaskWithParent":
            parentTaskObj.state.subtaskCount--;
        break;
    }
    // check edge case
    if ( parentTaskObj.state.subtaskCount > 0 ) {
        parentTaskObj.state.subtaskWeight = 100/parentTaskObj.state.subtaskCount;
        parentTaskObj.state.progress = 
            (parentTaskObj.state.subtasksDone / 
             parentTaskObj.state.subtaskCount) * 100;
    } else {
        parentTaskObj.state.subtaskWeight = 0;
        parentTaskObj.state.progress = 0;
    }    

    (function updateLocalProgress(){
        document
            .getElementById(thisTask.parent).querySelector(".progress")
            .style.width =
                parentTaskObj.state.progress;
    }());

    var localStates = {
        prevLocalProgress: prevLocalState.progress,
        localProgress: parentTaskObj.state.progress
    }

    return localStates;
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


            console.log("before: ");
            console.table(tasks);
            console.log(appState);
            callback(callbackParams);
            console.log("after: ");
            console.table(tasks);
            console.log(appState);


            closeModal();
        } else if ( e.target.classList.contains("js-cancel") ) {
            closeModal();
        }
    };
}

function deleteTask(taskCard) {
    
    var thisTask = tasks.find( (item) => item.id.toString() === taskCard.id );
    if ( thisTask === undefined ) {
        // in case that the task was already done
        thisTask = tasksDone.find( (item) => item.id.toString() === taskCard.id );
    }

  //----------------------------------------------------------------------------

    function deleteTaskObjectAndCard() {
        // delete task (in tasks array)
        tasks.splice( tasks.indexOf( thisTask ), 1 );       
        // delete task card 
        taskCard.parentNode.removeChild(taskCard);                
    }

  //----------------------------------------------------------------------------

    // LEVEL 1 | NO CHILDREN
    // - delete card
    // - delete task
    // - update appState
    // - update global progress bar
    function deleteMainTaskNoChildren() {

        deleteTaskObjectAndCard();
        updateGlobalProgress( updateAppState("deleteMainTaskNoChildren") );

    }

    // LEVEL 1 | WITH CHILDREN
    // - delete card
    // - delete task
    // - delete children (this doesn't invoke the case LEVEL 2 | WITH PARENT) 
    //   for better performance
    // - update appState
    // - update global progress bar 
    function deleteMainTaskWithChildren() {

        // save a copy of the progress it had
        // @notes
        // [1] It is needed to avoid having to place the same conditional when
        //     appState is being updated (netLocalProgressSum)
        var prevLocalProgress = 
            ( thisTask.progress > 0 ) ?
                clone(thisTask).progress:
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
                var subtaskObj = tasks.find( (item) => item.id === subtasks[i] );
                if ( subtaskObj === undefined ) {
                    // in case that the task was already done
                    subtaskObj = tasksDone.find( (item) => item.id === subtasks[i] );
                    tasksDone.splice( tasksDone.indexOf( subtaskObj ), 1); 
                } else {
                    tasks.splice( tasks.indexOf( subtaskObj ), 1); 
                }                
                  
            }
        }());

        deleteTaskObjectAndCard();

        // update App State "manually" for the sake of simplicity
        appState.taskCount--;
        appState.taskWeight = 
            appState.taskCount>0  ?  100/appState.taskCount  :  0;
        appState.netLocalProgressSum-= prevLocalProgress;
        appState.globalProgress = appState.taskWeight*appState.netLocalProgressSum;

        updateGlobalProgress(appState);

    }

  //----------------------------------------------------------------------------

    // LEVEL 2 | NO PARENT
    // - delete card
    // - delete task
    //     - check if it was done (to know where to look for it).This was 
    //        already done by thisTask assignation
    // - 🚫 update appState (not needed because it is calculated from
    //   <parentTask>.state and this task has no parent)
    // - 🚫 update global progress bar (not needed because it is calculated from
    //   <parentTask>.state and this task has no parent)
    function deleteSubtaskNoParent() {
        deleteTaskObjectAndCard();
    }


    // LEVEL 2 | WITH PARENT
    // - delete card
    // - delete task
    //     - check if it was done (to know where to look for it). This was 
    //        already done by thisTask assignation
    // - update parent's state
    // - update parent's progress bar
    // - update appState
    // - update global progress bar 
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

        deleteTaskObjectAndCard();

        console.log("Inside: before");
        console.log(parentTaskObj.state);
        // update its parent's state and update global state and UI accordingly
        updateGlobalProgress(
            updateAppState(
                "updateLocalState",
                updateLocalState(
                    parentTaskObj, 
                    thisTask, 
                    "deleteSubtaskWithParent"
                )
            )
        ); 
        console.log("Inside: after");
        console.log(parentTaskObj.state); 

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
function markAsDone(taskCard) {

    var thisTask = tasks.find( (item) => item.id.toString() === taskCard.id );

  //----------------------------------------------------------------------------

  /*
    - 
  */


  //----------------------------------------------------------------------------

    // function doneMainTask() { for common stuff?? }

    // LEVEL 1 | NO CHILDREN
    // - change button style
    // - set state.progress to 100
    // - animate the task bar to reach 100%
    // - remove task from tasks / add completion date
    // - fade out card
    // - fire notifications (all main tasks add the same score for this version)
    // - add task to tasksDone
    // - update gameState
    // - update appState
    // - update global progress
    function doneMainTaskNoChildren() {
        // change button style
        taskCard.querySelector(".js-markAsDone span").classList.toggle("icon-unchecked");
        taskCard.querySelector(".js-markAsDone span").classList.toggle("icon-check");
        // update this task object
        thisTask.state.progress = 100;        
        // update global task data structures
        thisTask.completionDate = new Date();
        tasksDone.push(thisTask);
        tasks.splice( tasks.indexOf( thisTask ), 1 );
        //
        taskCard.querySelector(".progress").style.width = "100%";
        fadeOut(taskCard);
        showNotification();
        // 
        gameState.xp++;
        gameState.score++;
        //
        appState.globalProgress += appState.taskWeight;
        //
        updateGlobalProgress(appState);
    }

    // LEVEL 1 | WITH CHILDREN
    // - change button style
    // - set state.progress to 100
    // - animate the task bar to reach 100%
    // - remove task from tasks / add completion date
    // - remove children subtasks from tasks
    // - remove children cards gracefully (perhaps an animation that includes
    //   some anticipation adding extra padding and then shrink/collapse them)
    // - fade out card
    // - fire notifications (all main tasks add the same score for this version)
    // - add task to tasksDone (think about adding the tasks too)
    // - update gameState
    // - update appState
    // - update global progress
    function doneMainTaskWithChildren() {



    }

  //----------------------------------------------------------------------------

    // LEVEL 2 | NO PARENT
    // - change button style
    // - change card style
    // - set state.progress to 100
    // - 🚫 no need to update any progress thing
    // - 🚫 avoid changing it from tasks to tasksDone, since it is better to 
    //   remove it once the user hits delete
    function doneSubtaskNoParent() {



    }

    // LEVEL 2 | WITH PARENT
    // - change button style
    // - change card style
    // - set state.progress to 100
    // - update <parent>.state
    // - update parent's progress bar
    // - update appState
    // - update global progress bar
    // - 🚫 avoid changing it from tasks to tasksDone, since it is better to 
    //   remove them all at once after their parent has been completed 
    function doneSubtaskWithParent() {



    }

  //----------------------------------------------------------------------------

    if ( thisTask.level === "Level 1" ) {

        if ( thisTask.children.length !== 0 ) {
            doneMainTaskWithChildren();
        } else {
            doneMainTaskNoChildren();
        }

    } else {

        if ( thisTask.parent !== null ) {
            doneSubtaskWithParent();
        } else {
            doneSubtaskNoParent();
        }

    }
    // - change button style
    // - change card style

}

function markAsUndone(taskCard) {

    var thisTask = tasksDone.find( (item) => item.id.toString() === taskCard.id );

    // this only has 2 cases since it only applies to level 2 cards :P


}
// points

// every task completed must contain the date of completion
// sub-tasks don't affect directly the global progress bar (they affect the
// progress bar of the parent task)

// Mark as done (subtask)
// ¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨
// local progress
// points



///////////////
///////////////
///////////////_________________________________________________________________
/*
- localStorage
    - add to apis guide properly → https://developer.mozilla.org/en-US/docs/Web/API/Storage
- daily reset / initialization
- clean HTML base

- draganddrop


*/


}())

}());
