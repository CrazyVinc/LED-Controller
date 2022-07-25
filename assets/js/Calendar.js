flatpickr.localize(flatpickr.l10ns.nl);
var calendar;
var Panels = {};

function NewEvent(Date, Data) {
    if (Panels["NewEvent"] !== undefined) {
        Panels["NewEvent"].close();
    }
    Panels["NewEvent"] = jsPanel.create({
        onclosed: function (panel, closedByUser) {
            delete Panels["NewEvent"];
        },
        contentAjax: {
            method: "POST",
            url: "/modal/NewEvent?date=" + Date,
            data: JSON.stringify(Data),
        },
        callback: function () {
            setTimeout(() => {
                InitializeForm();
            }, 2500);
        },
        headerTitle: "New Event: " + Date,
        theme: "dark",
        border: "thick",
        contentSize: "75vw 75vh"
    });
}
function EditEvent(URL, Name, Data) {
    if (Panels["EditEvent-" + Data.extendedProps.ID] !== undefined) {
        Panels["EditEvent-" + Data.extendedProps.ID].close();
    }
    
    Panels["EditEvent-" + Data.extendedProps.ID] = jsPanel.create({
        onclosed: function (panel, closedByUser) {
            delete Panels["EditEvent-" + Data.extendedProps.ID];
        },
        contentAjax: {
            method: "POST",
            url: URL,
            data: JSON.stringify(Data)
        },
        beforeSend: function() {
            this.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        },
        headerTitle: Name,
        theme: "dark",
        border: "thick",
        contentSize: "75vw 75vh",
    });
}

document.addEventListener("DOMContentLoaded", function () {
    var calendarEl = document.getElementById("calendar");
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        eventTimeFormat: {
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false,
        },
        firstDay: 1,
        dateClick: function (info) {
            NewEvent(info.dateStr, info);
        },
        eventDisplay: "block",
        eventClick: function (info) {
            info.jsEvent.preventDefault();

            if (info.event.url) {
                EditEvent(info.event.url, info.event.title, info.event);
                console.log(info);
            }
        },
        events: "/api/GetFeed",
    });
    calendar.render();
});

function CheckCron() {
    var http = new XMLHttpRequest();
    var url = "/api/VerifyCron";
    var params = "CronTime=" + document.getElementById("CronSel").value;
    http.open("POST", url, true);

    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    http.onreadystatechange = function () {
        //Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            alert(http.responseText);
        }
    };
    http.send(params);
}
function hint(content) {
    jsPanel.hint.create({
        position: "center-top 0 15 down",
        contentSize: "330 auto",
        content: content,
        theme: "success filled",
        headerTitle: '<i class="fa-regular fa-message"></i> Response',
        autoclose: "5s",
    });
}

function Delete(ID, Data) {
    var http = new XMLHttpRequest();
    var url = "/api/delete/" + ID;
    http.open("POST", url, true);

    http.setRequestHeader("Content-type", "application/json");

    http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status == 200) {
            Panels["EditEvent-" + Data.extendedProps.ID].close();
            hint(http.responseText);
            calendar.refetchEvents();
        }
    };
    http.send();
}
function BlockTime(ID, Data) {
    console.log("BlockTime", ID)
    var http = new XMLHttpRequest();
    var url = "/api/blocktime/" + ID;
    http.open("POST", url, true);

    //Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/json");

    http.onreadystatechange = function () {
        //Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            hint(http.responseText);
            calendar.refetchEvents();
            Panels["EditEvent-" + Data.extendedProps.ID].close();
        }
    };
    http.send(JSON.stringify(Data));
}
function UnblockTime(ID, Data) {
    var http = new XMLHttpRequest();
    var url = "/api/Unblocktime/" + ID;
    http.open("POST", url, true);

    //Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/json");

    http.onreadystatechange = function () {
        //Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            hint(http.responseText);
            calendar.refetchEvents();
            Panels["EditEvent-" + Data.extendedProps.ID].close();
        }
    };
    http.send(JSON.stringify(Data));
}

function ReturnError(error, ErrorObject) {
    bulmaToast.toast({
      message: error,
      type: 'is-danger',
      position: 'top-center'
    });
    return ErrorObject || error;
  }