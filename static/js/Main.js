
//handle slider value changes
var slider = document.getElementById("mask_range_input");
var output = document.getElementById("slider_value");
var outputhtml =document.getElementById("slider_val");

outputhtml.innerHTML = slider.value+"%"; // Display the default slider value


// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
    output.value = this.value;
    outputhtml.innerHTML = slider.value +'%';
}

//setup onclick listener for dates dropdown
var dates = document.getElementById('day_buttons')
dates.oninput = function(){
    run_simulation(dates.value);
}

var play_pause = document.getElementById('play_pause');
play_pause.onclick = function (){
    var icon = document.getElementById('playicon');
    if (play_pause.value === "pause"){
        play_pause.value = 'play'
        icon.className='play icon'
        console.log(simulation)
        simulation.stop()
    }else{
        play_pause.value = 'pause'
        icon.className='pause icon'
        console.log(simulation)
        simulation.alpha(1).restart().tick();
    }
}