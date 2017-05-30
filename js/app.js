window.onload = initialize

function initialize() {
    initializeFirebase()
    var ref = firebase.database().ref()

    render(decodeURI(window.location.hash), true);

    $(window).on('hashchange', function () {
        render(decodeURI(window.location.hash));
    });

    function initializeFirebase() {
        var config = {
            apiKey: "AIzaSyCEnkPeAk-L-YqiHgiSIW-I4rEMC-LMyR4",
            authDomain: "lists-191c7.firebaseapp.com",
            databaseURL: "https://lists-191c7.firebaseio.com",
            projectId: "lists-191c7",
            storageBucket: "lists-191c7.appspot.com",
            messagingSenderId: "790761013031"
        };
        firebaseApp = firebase.initializeApp(config);
    }

    function getListGroupID() {
        return decodeURI(window.location.hash).split('/')[2]
    }

    function getListID() {
        return decodeURI(window.location.hash).split('/')[1]
    }

    function render(url) {
        var urlArray = url.split('/')
        $('.main-content .page').hide();
        switch (urlArray.length) {
            case 1:
                renderHomePage();
                break;
            case 2:
                renderListPage(urlArray[1]);
                break;
            case 3:
                renderListGroupPage(urlArray[2]);
                break;
            default:
                renderErrorPage();
                break;
        }
    }

    function renderHomePage() {
        $('#signupLink').removeClass('active')
        $('.home').show();
        $("#txtListGroupName").keyup(function (event) {
            if (event.keyCode == 13) {
                $("#createListGroupButton").click();
            }
        });
        $('#txtListGroupName').focus()
    }

    $('#createListGroupButton').click(function createListGroup() {
        if ($.trim($('#txtListGroupName').val()).length < 1) {
            $("#home-page-input-group").addClass("has-error")
            $("#txtListGroupName").focus()
        } else {
            $("#home-page-input-group").removeClass("has-error")
            $("#txtListGroupName").unbind()
            var datetime = moment().format()
            var data = {
                ListGroupName: document.getElementById('txtListGroupName').value,
                DateTimeUnix: moment(datetime).unix(),
            }
            var listGroupKey = ref.child('ListGroups').push(data).key;
            $('#txtListGroupName').val('')
            window.location.href = "/#/lg/" + listGroupKey;
        }
    })

    function renderListGroupPage(listGroupID) {
        $("#txtListName").unbind()
        $('#list-group-page-list-names').empty()
        $('.listgroup').show();
        ref.child('ListGroups/' + listGroupID).once("value", function (snapshot) {
            if (snapshot.val() == null) {
                $("#list-group-content").hide()
                $("#list-group-error").show()
            } else {
                $("#list-group-content").show()
                $("#list-group-error").hide()
                $("#list-group-page-list-group-name").html(snapshot.val().ListGroupName)
                listsRef = firebase.database().ref('ListGroups/' + listGroupID + '/Lists');
                listsRef.off("child_added")
                listsRef.on("child_added", function (snapshot) {
                    listHtml = "<li class='list-group-item clearfix' id='" + snapshot.key + "'>"
                    listHtml += "<a href='/#/" + snapshot.key + "'>" + snapshot.val() + "</a>"
                    listHtml += "<span class='pull-right'><button id='delete-" + snapshot.key + "' class='btn btn-xs btn-warning'>"
                    listHtml += "<span class='glyphicon glyphicon-trash'></span>"
                    listHtml += "</button></span>"
                    listHtml += "</li>"
                    $('#list-group-page-list-names').prepend(listHtml)
                    $('#delete-' + snapshot.key).on('click', function () {
                        var deleteData = {}
                        deleteData['ListGroups/' + getListGroupID() + '/Lists/' + snapshot.key] = null
                        deleteData['Lists/' + snapshot.key] = null
                        ref.update(deleteData)
                    })
                })
                listsRef.on("child_removed", function (snapshot) {
                    $('#' + snapshot.key + '').fadeOut(0);
                })
                $("#txtListName").keyup(function (event) {
                    if (event.keyCode == 13) {
                        $("#createListButton").click();
                    }
                });
                $('#txtListName').focus()
            }
        })
    }

    $('#createListButton').click(function createList() {
        if ($.trim($('#txtListName').val()).length < 1) {
            $("#list-group-page-input-group").addClass("has-error")
            $("#txtListName").focus()
        } else {
            $("#list-group-page-input-group").removeClass("has-error")
            var newListKey = ref.child("ListGroups/" + getListGroupID() + "/Lists").push().key
            var datetime = moment().format()
            var data = {}
            data["Lists/" + newListKey] = {
                ListName: document.getElementById('txtListName').value,
                DateTimeUnix: moment(datetime).unix()
            }
            data["ListGroups/" + getListGroupID() + "/Lists/" + newListKey] = document.getElementById('txtListName').value
            ref.update(data)
            $('#txtListName').val('')
        }
        window.location.href = "/#/" + newListKey;
    })

    function renderListPage(ListID) {
        $("#txtListItemName").unbind()
        $('#list-page-list-items').empty()
        $('.list').show();
        ref.child('Lists/' + ListID).once("value", function (snapshot) {
            if (snapshot.val() == null) {
                $("#list-content").hide()
                $("#list-error").show()
            } else {
                $("#list-content").show()
                $("#list-error").hide()
                $("#list-page-list-name").html(snapshot.val().ListName)

                listItemsRef = firebase.database().ref('Lists/' + ListID + '/ListItems').orderByChild('priority')
                listItemsRef.off("child_added")

                var isInitialDataLoaded = false

                listItemsRef.on("child_added", function (snapshot) {
                    var isCompleteStyle = "incomplete"
                    var itemPriority = snapshot.val().priority
                    var colorCodeForeColor = ""
                    if (snapshot.val().colorCode == "") { colorCodeForeColor = "black" } else { colorCodeForeColor = "white" }
                    if (snapshot.val().isComplete == false) { isCompleteStyle = "incomplete" } else { isCompleteStyle = "complete" }

                    listItemHtml = "<li class='list-group-item clearfix " + isCompleteStyle + "' id='" + snapshot.key + "' data-priority='" + snapshot.val().priority + "'>"

                    listItemHtml += "<div class='dropdown pull-left' style='display:inline-block;'>"
                    listItemHtml += "<button id='btnFlag-" + snapshot.key + "' class='btn btn-xs btn-default dropdown-toggle' data-toggle='dropdown' style='margin-right:8px;background: " + snapshot.val().colorCode + "; color: " + colorCodeForeColor + "; opacity: 0.6;'><span class='glyphicon glyphicon-flag'></span></button>&nbsp;"
                    listItemHtml += "<ul class='dropdown-menu pull-left'>"
                    listItemHtml += "<li id='itemcolor-none-" + snapshot.key + "'><a style='cursor: pointer;'><div class='color-selector-color' style='background: white';></div>None</a></li>"
                    listItemHtml += "<li id='itemcolor-blue-" + snapshot.key + "'><a style='cursor: pointer;'><div class='color-selector-color' style='background: #0000FF';></div> Blue</a></li>"
                    listItemHtml += "<li id='itemcolor-green-" + snapshot.key + "'><a style='cursor: pointer;'><div class='color-selector-color' style='background: #00C415';></div> Green</a></li>"
                    listItemHtml += "<li id='itemcolor-orange-" + snapshot.key + "'><a style='cursor: pointer;'><div class='color-selector-color' style='background: #ff8800';></div> Orange</a></li>"
                    listItemHtml += "<li id='itemcolor-purple-" + snapshot.key + "'><a style='cursor: pointer;'><div class='color-selector-color' style='background: #a600d1';></div> Purple</a></li>"
                    listItemHtml += "<li id='itemcolor-red-" + snapshot.key + "'><a style='cursor: pointer;'><div class='color-selector-color' style='background: #FF0000';></div>Red</a></li>"
                    listItemHtml += "</ul>"
                    listItemHtml += "</div>"

                    listItemHtml += "<div class='item-handle pull-left'><i class='fa fa-bars' aria-hidden='true'></i></div>"
                    listItemHtml += "<span class='itemspan' id='itemspan-" + snapshot.key + "'>"
                    listItemHtml += "<div class='checkmark checkmark-" + isCompleteStyle + " pull-left' id='checkmark-" + snapshot.key + "'><i class='fa fa-check-circle' aria-hidden='true'></i></div>"
                    listItemHtml += "<div id='list-item-text-" + snapshot.key + "' class='itemtext itemtext-" + isCompleteStyle + "'>" + snapshot.val().ListItemName + "</div>"
                    listItemHtml += "</span>"
                    listItemHtml += "<div class='pull-right'>"
                    listItemHtml += "<button id='delete-" + snapshot.key + "' class='btn btn-xs btn-warning'>"
                    listItemHtml += "<span class='glyphicon glyphicon-trash'></span>"
                    listItemHtml += "</button></div>"
                    listItemHtml += "</li>"

                    if (isInitialDataLoaded) {
                        $('#list-page-list-items').prepend(listItemHtml)
                    } else {
                        $('#list-page-list-items').append(listItemHtml)
                    }

                    $('#itemspan-' + snapshot.key).on('click', function () {
                        if ($('#list-item-text-' + snapshot.key).hasClass("itemtext-incomplete")) {
                            // Mark as complete and move to bottom of the list
                            ref.child('/Lists/' + ListID + '/ListItems/' + snapshot.key).update({ isComplete: true })
                            var updateData = {}
                            for (var i = $('#' + snapshot.key).index() + 1; i <= $('#list-page-list-items > li').length - 1; i++) {
                                if (typeof $('#list-page-list-items > li').eq(i).attr('id') !== typeof undefined && $('#list-page-list-items > li').eq(i).is(":visible")) {
                                    updateData["/" + $('#list-page-list-items > li').eq(i).attr('id') + "/priority"] = parseInt($('#list-page-list-items > li').eq(i).attr('data-priority')) - 1
                                }
                            }
                            updateData["/" + snapshot.key + "/priority"] = parseInt($('#list-page-list-items > li').last().attr('data-priority'))
                            ref.child('/Lists/' + ListID + '/ListItems').update(updateData)
                        }
                        else {
                            // Mark as incomplete and move to top of the list
                            ref.child('/Lists/' + ListID + '/ListItems/' + snapshot.key).update({ isComplete: false })
                            var updateData = {}
                            for (var i = 0; i <= $('#' + snapshot.key).index(); i++) {
                                if (typeof $('#list-page-list-items > li').eq(i).attr('id') !== typeof undefined && $('#list-page-list-items > li').eq(i).is(":visible")) {
                                    updateData["/" + $('#list-page-list-items > li').eq(i).attr('id') + "/priority"] = parseInt($('#list-page-list-items > li').eq(i).attr('data-priority')) + 1
                                }
                            }
                            updateData["/" + snapshot.key + "/priority"] = parseInt($('#list-page-list-items > li').first().attr('data-priority'))
                            ref.child('/Lists/' + ListID + '/ListItems').update(updateData)
                        }
                    })

                    $('#delete-' + snapshot.key).on('click', function () {
                        //get keys below deleted item and decrement their priorities
                        var updateData = {}
                        for (var i = $('#' + snapshot.key).index() + 1; i <= $('#list-page-list-items > li').length - 1; i++) {
                            if (typeof $('#list-page-list-items > li').eq(i).attr('id') !== typeof undefined && $('#list-page-list-items > li').eq(i).is(":visible")) {
                                updateData["/" + $('#list-page-list-items > li').eq(i).attr('id') + "/priority"] = parseInt($('#list-page-list-items > li').eq(i).attr('data-priority')) - 1
                                $('#' + $('#list-page-list-items > li').eq(i).attr('id')).attr('data-priority', parseInt($('#list-page-list-items > li').eq(i).attr('data-priority')) - 1)
                            }
                        }
                        ref.child('/Lists/' + ListID + '/ListItems').update(updateData)
                        // delete the item
                        ref.child('Lists/' + getListID() + '/ListItems/' + snapshot.key).remove()
                    })

                    var colorUpdate = {}

                    $('#itemcolor-red-' + snapshot.key).on('click', function () {
                        colorUpdate["/" + snapshot.key + "/colorCode"] = "#FF0000"
                        ref.child('Lists/' + ListID + '/ListItems').update(colorUpdate)
                    })

                    $('#itemcolor-green-' + snapshot.key).on('click', function () {
                        colorUpdate["/" + snapshot.key + "/colorCode"] = "#00C415"
                        ref.child('Lists/' + ListID + '/ListItems').update(colorUpdate)
                    })

                    $('#itemcolor-blue-' + snapshot.key).on('click', function () {
                        colorUpdate["/" + snapshot.key + "/colorCode"] = "#0000FF"
                        ref.child('Lists/' + ListID + '/ListItems').update(colorUpdate)
                    })

                    $('#itemcolor-none-' + snapshot.key).on('click', function () {
                        colorUpdate["/" + snapshot.key + "/colorCode"] = ""
                        ref.child('Lists/' + ListID + '/ListItems').update(colorUpdate)
                    })
                    $('#itemcolor-orange-' + snapshot.key).on('click', function () {
                        colorUpdate["/" + snapshot.key + "/colorCode"] = "#ff8800"
                        ref.child('Lists/' + ListID + '/ListItems').update(colorUpdate)
                    })

                    $('#itemcolor-purple-' + snapshot.key).on('click', function () {
                        colorUpdate["/" + snapshot.key + "/colorCode"] = "#a600d1"
                        ref.child('Lists/' + ListID + '/ListItems').update(colorUpdate)
                    })
                });

                listItemsRef.once("value", function (snapshot) {
                    isInitialDataLoaded = true;
                })

                listItemsRef.on("child_removed", function (snapshot) {
                    // Use to have a fade-out, but this just hid the div, and made sorting and other index functions a problem
                    $('#' + snapshot.key + '').remove(0);
                })

                listItemsRef.on("child_changed", function (snapshot) {
                    // Check: Completion Status
                    if (snapshot.val().isComplete == true) {
                        $('#list-item-text-' + snapshot.key).removeClass("itemtext-incomplete")
                        $('#list-item-text-' + snapshot.key).addClass("itemtext-complete")
                        $('#checkmark-' + snapshot.key).removeClass("checkmark-incomplete")
                        $('#checkmark-' + snapshot.key).addClass("checkmark-complete")
                        $('#' + snapshot.key).addClass("complete")
                        $('#' + snapshot.key).removeClass("incomplete")
                    }
                    if (snapshot.val().isComplete == false) {
                        $('#list-item-text-' + snapshot.key).removeClass("itemtext-complete")
                        $('#list-item-text-' + snapshot.key).addClass("itemtext-incomplete")
                        $('#checkmark-' + snapshot.key).removeClass("checkmark-complete")
                        $('#checkmark-' + snapshot.key).addClass("checkmark-incomplete")
                        $('#' + snapshot.key).addClass("incomplete")
                        $('#' + snapshot.key).removeClass("complete")
                    }

                    // Check: Color Code
                    if (snapshot.val().colorCode == "") {
                        $('#btnFlag-' + snapshot.key).css('color', 'black')
                    } else {
                        $('#btnFlag-' + snapshot.key).css('color', 'white')
                    }
                    $('#btnFlag-' + snapshot.key).css('background', snapshot.val().colorCode)

                    // Check: Priority
                    ref.child('Lists/' + getListID() + '/ListItems').orderByChild('priority').once("value", function (snapshot) {
                        var i = 0
                        var diff = false
                        snapshot.forEach(function (childsnapshot) {
                            if ($('#list-page-list-items > li').eq(i).attr('id') != childsnapshot.key) {
                                $('#' + childsnapshot.key).attr('data-priority', childsnapshot.val().priority)
                                diff = true
                            }
                            i += 1
                        })
                        if (diff == true) {
                            var $wrapper = $('#list-page-list-items');
                            $wrapper.find('.list-group-item').sort(function (a, b) {
                                return a.dataset.priority - b.dataset.priority;
                            }).appendTo($wrapper);
                        }
                    })
                })

                $("#txtListItemName").keyup(function (event) {
                    if (event.keyCode == 13) {
                        $("#createListItemButton").click();
                    }
                });

                var keysAbove = []
                var keysBelow = []
                var newPriority = ""
                var updatedPriorityData = {}

                $('#list-page-list-items').sortable({
                    handle: '.item-handle',
                    start: function (e, ui) {
                        keysAbove = []
                        keysBelow = []
                        newPriority = ""
                        updatedPriorityData = {}
                        $(this).attr('data-previndex', ui.item.index())
                    },
                    update: function (e, ui) {
                        for (var i = 0; i < ui.item.index(); i++) {
                            if (typeof $('#list-page-list-items > li').eq(i).attr('id') !== typeof undefined && $('#list-page-list-items > li').eq(i).is(":visible")) {
                                keysAbove.push($('#list-page-list-items > li').eq(i).attr('id'))
                            }
                        }
                        for (var i = ui.item.index() + 1; i <= $('#list-page-list-items > li').length - 1; i++) {
                            if (typeof $('#list-page-list-items > li').eq(i).attr('id') !== typeof undefined && $('#list-page-list-items > li').eq(i).is(":visible")) {
                                keysBelow.push($('#list-page-list-items > li').eq(i).attr('id'))
                            }
                        }

                        if (ui.item.index() == 0) { newPriority = 0 } else {
                            ref.child('Lists/' + ListID + '/ListItems/' + keysAbove[keysAbove.length - 1]).once("value", function (snapshot) {
                                newPriority = snapshot.val().priority
                            })
                            if ($(this).attr('data-previndex') > ui.item.index()) { newPriority += 1 }
                        }

                        var updatedPriorityData = {}
                        for (i = 0; i < keysAbove.length; i++) {
                            updatedPriorityData["/" + keysAbove[i] + "/priority"] = i
                            $('#' + keysAbove[i]).attr('data-priority', i)
                            updatedPriorityData["/" + keysAbove[i] + "/lastMoved"] = false
                        }
                        for (i = 0; i < keysBelow.length; i++) {
                            pri = i + newPriority + 1
                            updatedPriorityData["/" + keysBelow[i] + "/priority"] = pri
                            $('#' + keysBelow[i]).attr('data-priority', pri)
                            updatedPriorityData["/" + keysBelow[i] + "/lastMoved"] = false

                        }
                        updatedPriorityData["/" + $('#list-page-list-items > li').eq(ui.item.index()).attr('id') + "/priority"] = newPriority
                        $('#' + $('#list-page-list-items > li').eq(ui.item.index()).attr('id')).attr('priority', i)
                        updatedPriorityData["/" + $('#list-page-list-items > li').eq(ui.item.index()).attr('id') + "/lastMoved"] = true
                        //$('#' + $('#list-page-list-items > li').eq(ui.item.index()).attr('id')).attr('data-priority', newPriority)
                        ref.child('Lists/' + ListID + '/ListItems').update(updatedPriorityData)
                    },
                })
                $('#txtListItemName').focus()
            }
        })
    }

    $('#createListItemButton').click(function createListItem() {
        if ($.trim($('#txtListItemName').val()).length < 1) {
            $("#list-page-input-group").addClass("has-error")
            $("#txtListItemName").focus()
        } else {
            $("#list-page-input-group").removeClass("has-error")
            // Increment priority of all pre-existing items by 1
            var updateData = {}
            $('#list-page-list-items > li').each(function (i, e) {
                updateData["/" + $(e).attr('id') + "/priority"] = parseInt($(e).attr('data-priority')) + 1
                $('#' + $(e).attr('id')).attr('data-priority', parseInt($(e).attr('data-priority')) + 1)
            })
            ref.child('Lists/' + getListID() + '/ListItems').update(updateData)

            // Add new item with priority 0
            var datetime = moment().format()
            var data = {
                ListItemName: document.getElementById('txtListItemName').value,
                colorCode: "",
                priority: 0,
                DateTimeUnix: moment(datetime).unix(),
                isComplete: false,
                lastMoved: false
            }
            ref.child('Lists/' + getListID() + '/ListItems').push(data).key;
            $('#txtListItemName').val('')
            $('#txtListItemName').focus()
        }
    })

    function renderErrorPage() {
        $('.error').show();
    }

    function translateError(operation, error) {
        var output = error.message
        switch (operation) {
            case "signinUser":
                switch (error.code) {
                    case "auth/invalid-email":
                        output = "Incorrect password"
                        break;
                    case "auth/wrong-password":
                        output = "Incorrect password"
                        break;
                    case "auth/weak-password":
                        output = error.message
                        break;
                    case "auth/email-already-in-use":
                        output = error.message
                        break;
                }
                break;
            case "createUser":
                switch (error.code) {
                    case "auth/invalid-email":
                        output = "Please enter a valid email address."
                        break;
                    case "auth/weak-password":
                        output = error.message
                        break;
                    case "auth/email-already-in-use":
                        output = error.message
                        break;
                    case "auth/app-not-authorized":
                        output = "Application is probably broken - Please contact the administrator."
                        break;
                }
                break
        }
        return output;
    }
} 