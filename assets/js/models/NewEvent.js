function InitializeForm() {
    var form2 = document.querySelector("form");
    console.log(form2)
    form2.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new URLSearchParams();
        var formdata = new FormData(form2);
        const Switches = document.querySelectorAll(
            "#LEDSwitches input[type=checkbox]"
        );

        Switched = [];
        formdata.set("LEDs", ['dummy']);
        Switches.forEach((elm) => {
          if (elm.checked) {
              var tmp = { name: elm.dataset.name };
              var Value = document.getElementById(elm.dataset.id + "Value");
              tmp["value"] = (Value.checked || Value.dataset.value  || Value.value || false);
              tmp["type"] = elm.dataset.type;

              Switched.push(tmp);
              formdata.append("LEDs", JSON.stringify(tmp));
            }
        });
        if (Switched.length == 0) return ReturnError("No LED enabled!");

        if (document.getElementById("RunType").checked) {
            formdata.append("RunType", "Cron");
            if (
                !(
                    formdata.has("Sec") &&
                    formdata.has("Min") &&
                    formdata.has("Hours") &&
                    formdata.has("DayOfWeek") &&
                    formdata.has("Months") &&
                    formdata.has("DayOfMonth")
                )
            ) {
                return ReturnError("Cron niet volledig!");
            }
        } else {
            formdata.append("RunType", "Calendar");
            if (cal.selectedDates == "") {
                bulmaToast.toast({
                    message: "Geen datum gekozen!",
                    type: "is-danger",
                    position: "top-center",
                });
                return "Geen datum gekozen!";
            }
            formdata.append("Calendar", moment(cal.selectedDates).format());
        }

        for (const pair of formdata) {
            console.log(pair);
            data.append(pair[0], pair[1]);
        }

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/new/event");
        xhr.setRequestHeader(
            "Content-Type",
            "application/x-www-form-urlencoded; charset=UTF-8"
        );
        xhr.send(data);

        xhr.onload = () => {
            console.log(xhr.responseText);
        };
    });
    window.cal = flatpickr("#TimeSel", {
        enableTime: true,
        enableSeconds: true,
        inline: true,
    });
}
function selectAll(elmt) {
    SelectElm = elmt.parentElement;
    for (i = 0; i < SelectElm.length; i++) {
        SelectElm[i].selected = true;
    }
}

function StateChange() {
    const Switches = document.querySelectorAll(
        "#LEDSwitches input[type=checkbox]"
    );

    Switches.forEach((elm) => {
        if (elm.checked) {
            document.getElementById(elm.id.slice(0, -6)).style.display = "";
        } else {
            document.getElementById(elm.id.slice(0, -6)).style.display = "none";
        }
    });

    if (document.getElementById("RunType").checked) {
        document.getElementById("Cron").style.display = "";
        document.getElementById("Calendar").style.display = "none";
    } else {
        document.getElementById("Calendar").style.display = "";
        document.getElementById("Cron").style.display = "none";
    }
}

function SetRGB(action) {
  document.getElementById(action.ID).value = action.rgb.r + ", " + action.rgb.g + ", " + action.rgb.b;
      document.getElementById(action.ID).dataset.value = [action.rgb.r, action.rgb.g, action.rgb.b];
}
