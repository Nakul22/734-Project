
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