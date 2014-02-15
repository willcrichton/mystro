$(function() {
    var ctl = new Leap.Controller({enableGestures: true});
    var swiper = ctl.gesture('swipe');
    var pointable;
    swiper.update(function(g) {
        // do things here
    });
    
    var stabilizedDisplay = document.getElementById("stabPosition");
    //var deltaDisplay = document.getElementById("delta");
    ctl.on('frame', function(frame){
	if(frame.pointables.length > 0)
        {
            var hands = frame.hands.filter(function(elem){return (elem.tools.length == 0)});
	    var toolHands = frame.hands.filter(function(elem){return (elem.tools.length > 0)});
            if(toolHands.length > 0)
            {
                var tool = toolhands[0].tools[0];
                var pointerTip = tool.stabilizedTipPosition;
                var pointerSpeed = tool.tipVelocity;
            }
            else
            {
                var pointerTip = null;
                var pointerSpeed = null;
            }
            if(hands.length > 0)
            {
                var handLoc = hands[0].stabilizedPalmPosition;
                var palmDir = hands[0].palmNormal;
                var fingerDir = hands[0].direction;
            }
            else
            {
                var handLoc = null;
                var palmDir = null;
                var fingerDir = null;
            }
            var pointable = frame.pointables.filter(function(elem){return elem.tool})[0];
            
            //stabilizedDisplay.innerText = "(" + Math.round(stabilizedPosition[0]) + ", " 
            //    + Math.round(stabilizedPosition[1]) + ", " 
            //    + Math.round(stabilizedPosition[2]) + ")";
            //    deltaDisplay.innerText = "(" + (tipPosition[0] - stabilizedPosition[0]) + ", "
            //        + (tipPosition[1] - stabilizedPosition[1]) + ", "
            //        + (tipPosition[2] - stabilizedPosition[2]) + ")";
	}
        //processInputs(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    });
    ctl.connect();
});
