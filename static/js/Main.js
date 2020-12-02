var path;
var play_speed = 1500;
var paused = false;
//handle slider value changes
// var slider = document.getElementById("mask_range_input");
// var output = document.getElementById("slider_value");
// var outputhtml =document.getElementById("slider_val");

// outputhtml.innerHTML = slider.value+"%"; // Display the default slider value


// Update the current slider value (each time you drag the slider handle)
// slider.oninput = function() {
//     output.value = this.value;
//     outputhtml.innerHTML = slider.value +'%';
// }

//setup onclick listener for dates dropdown
var dates = document.getElementById('day_buttons')
dates.oninput = function(){
    run_simulation(dates.value);
}

var speed = document.getElementById('speed')
speed.onchange = function(){
    if(speed.value ==='normal'){
        stop()
        remove_charts();
        play_speed=1500
        restart()
    }else if(speed.value ==='fast'){
        stop()
        remove_charts();
        play_speed=750
        restart()
    }else{
        stop()
        remove_charts();
        play_speed=2500
        restart()
    }
}

var submit = document.getElementById('submitbutton');
submit.onclick = function (){
    var form_data = $('#usercontrols').serializeArray()

    //setglobal path for other visualizations
    path = form_data[0].value+'_'+form_data[1].value+'_'+ form_data[2].value+'_'+form_data[3].value+'_'+form_data[4].value
    console.log(path)
    //fetch data from backend
fetch('/getdataset', {
    method:'POST',
    body:JSON.stringify({
        'time for result': form_data[0].value,
        'false_negatives': form_data[1].value,
        'days_between_tests': form_data[2].value,
        'quarantine': form_data[3].value,
        'prob_mask': form_data[4].value
    }),
    headers: new Headers({
        'content-type': 'application/json'
    })
})
.then(function(response){
    if(response.ok){
        response.json().then(function(data){
            
            
            //clean up data, make dates date objects
            for(let v in data){
                data[v].forEach(element => {
                    element['start'] = new Date(element['start'])
                    element['end'] = new Date(element['end'])
                });
            }
                    
            // visualization(data)
        })
    }
    else{
        console.log('unable to fetch data')
        return
    }
})
.catch(function(error){
    console.log('fetch error', error);
});
}

$('.ui.radio.checkbox')
  .checkbox();

var play_pause = document.getElementById('play_pause');
play_pause.onclick = function (){
    var icon = document.getElementById('playicon');
    if (play_pause.value === "pause"){
        play_pause.value = 'play'
        icon.className='play icon'
        stop()
    }else{
        play_pause.value = 'pause'
        icon.className='pause icon'
        restart()
    }
}

