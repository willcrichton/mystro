$(function() {
    var ctl = new Leap.Controller({enableGestures: true});
    var swiper = ctl.gesture('swipe');
    swiper.update(function(g) {
        // do things here
    });

    var stabilizedDisplay = document.getElementById("stabPosition");
    //var deltaDisplay = document.getElementById("delta");
    ctl.on('frame', function(frame){
	if(frame.pointables.length > 0)
	{
            var pointable = frame.pointables[0];
            var stabilizedPosition = pointable.stabilizedTipPosition;
            var tipPosition = pointable.tipPosition;
            stabilizedDisplay.innerText = "(" + Math.round(stabilizedPosition[0]) + ", " 
                + Math.round(stabilizedPosition[1]) + ", " 
                + Math.round(stabilizedPosition[2]) + ")";
        //    deltaDisplay.innerText = "(" + (tipPosition[0] - stabilizedPosition[0]) + ", "
        //        + (tipPosition[1] - stabilizedPosition[1]) + ", "
        //        + (tipPosition[2] - stabilizedPosition[2]) + ")";
	}
    });
    ctl.connect();
});
