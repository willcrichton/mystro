var dataProcessing = (function() {
    var oldData = [
        // key: value pairs where key is the time in ms
        // 1234: {
        //     pointerTip: ...,
        //     pointerSpeed: ..., 
        //     handLoc: ..., 
        //     ...
        //  }
    ]

    detectSelectCallback = function() {
//        console.log('No select callback registered.');
    }

    detectVolumeChangeCallback = function() {
        //console.log('No volume callback registered.');
    }
    detectTempoChangeCallback = function() {
        //console.log('No tempo callback registered.');
    }
    detectOrchLocCallback = function() {
        console.log('No location callback registered.');
    }

    // Gets the magnitude of a number vector with 0..2 indices
    function magnitude3(vec) {
        return Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]);
    }


    // Returns true if an instrumental group is selected.
    // returns false otherwise.
    function detectSelect(handLoc) {
	var ZPLANE = 0; 
	if(handLoc != null){
	    if(handLoc[2] < ZPLANE){
		detectSelectCallback(true);		
	    }
	}
    }


    // Detects whether the palm is facing up, down, or in between. Returns one of
    // 'up', 'down', or 'unknown'
    function palmDirType(palmDir) {
        var UP_PALM_THRESHOLD = .8;
        var DOWN_PALM_THRESHOLD = -.8;
        if(palmDir === null || palmDir === undefined) {
            throw new Error('There isn\'t a palmDir!');
        }
        // Negatively correlated with pointing anywhere
        var mag = magnitude3(palmDir);
        // Positively correlated with pointing up
        var upmag = palmDir[1];

        if(mag === 0.0) {
            console.log('Zero magnitude ball! Wow! Alert Philip!');
            if(upmag > 0) {
                return 'up';
            } else if(upmag < 0) {
                return 'down';
            } else {
                return 'unknown';
            }
        } else {
            var upness = upmag/mag;
            //console.log('upness = ' + upness);
            if(upness > UP_PALM_THRESHOLD) {
                return 'up';
            } else if(upness < DOWN_PALM_THRESHOLD) {
                return 'down';
            } else {
                return 'unknown';
            }
        }
    }

    var MIN_PALM_HEIGHT = 200;
    var MAX_PALM_HEIGHT = 400;
    function normedVol(absoluteVolDelta) {
        return absoluteVolDelta/(MAX_PALM_HEIGHT - MIN_PALM_HEIGHT);
    }

    // Returns change in volume, from -1.0 to 1.0.
    function detectVolumeChange(handLoc, palmDir) {
        if(palmDir === undefined) {
            throw new Error('There isn\'t a palmDir!');
        }
        //if(handLoc === null) TODO
        //if(palmDir === null) TODO
        wheresItPointing = palmDirType(palmDir);

        var thisHeightAndTheLastHeight = _.last(oldData, 2);
        var lastHeight = (thisHeightAndTheLastHeight[0])[1];
        var thisHeight = handLoc[1];
        var result = null;
        if(wheresItPointing === 'up') {
            if(thisHeight > lastHeight) {
                result = thisHeight - lastHeight;
                console.log('up');
            }
        } else if(wheresItPointing === 'down') {
            if(thisHeight < lastHeight) {
                result = lastHeight - thisHeight;
                console.log('down');
            }
        }
        //if(result === null) {console.log('n');}

        detectVolumeChangeCallback(normedVol(result));
    }


    // Use OLD DATA to caluate an average acceleration over the previous
    // n iterations.
    function acceleration(pointerSpeed, n){
	return 0;
    }
    
    
    
    
    // Returns whether the current state is a beat.
    function detectTempoChange(pointerTip, pointerSpeed, handLoc){
	
	//Using OLD DATA or something, return if data already happened.

        detectTempoChangeCallback(null);
    }

    // Points to a region in the orchestra.    
    // Does simple physics vector addition with some bounds.
    // Reasons why this doesn't work too well: Conductors point to groups of
    // musicians by a combination of their hand location and direction.
    // We can make the direction smooth (i.e. pointing at a place = place
    // lights up) but then left-right movement is shaky (really hard
    // to stay in the middle. Alternatively, we can have smooth
    // left-right movement but then pointing to a place won't work.
    // You can't point to the endpoints from the other endpoint.
    // There is not really a middle ground.

    // The variable to change is DEPTH. Lower DEPTH = smoother lateral movement.
    //                                  Higher DEPTH = smoother pointing.
    function detectOrchLoc(handLoc, fingerDir) {
        // Constants for determining edges

        var RIGHTEDGE = 50;
        var LEFTEDGE = -280; 
        var BOTTOMEDGE = 180;
        var TOPEDGE = 450;
        var DEPTH =  50;         //variable



	// Ignore out of place places, since the front end will 
	// display exactly what we want (unchanged).
        if(handLoc === null || (handLoc[0] < LEFTEDGE || handLoc[0] > RIGHTEDGE)
	   || (handLoc[1] < BOTTOMEDGE || handLoc[1] > TOPEDGE)){
	    console.log(handLoc);
            return;
        }
        var handX = handLoc[0];
        var handY = handLoc[1];

        if(fingerDir === null){
            fingerDir = [0, 0, 1];
        }

        var fingerX = fingerDir[0];
        var fingerY = fingerDir[1];
        
	var fingerNorm = Math.sqrt(fingerX*fingerX + fingerY*fingerY);
        if(fingerNorm === 0){
            var fingerLocNorm = [0,0];
        }
        else{
            var fingerLocNorm = [fingerX/fingerNorm, 
                      fingerY/fingerNorm];
        }
	
        var finalHandLoc = [handX + fingerLocNorm[0]*DEPTH, 
			    handY + fingerLocNorm[1]*DEPTH];
	var finalNormedLoc = [(finalHandLoc[0] - LEFTEDGE)/(RIGHTEDGE-LEFTEDGE), 
                  (finalHandLoc[1] - BOTTOMEDGE)/(TOPEDGE-BOTTOMEDGE)];
	
	finalNormedLoc = _.map(finalNormedLoc, function (v){ if(v < 0) {return 0;} 
					    else if(v > 1) {return 1;}
					    else return v;});
	
        detectOrchLocCallback(finalNormedLoc);
    }

    return {
        // Called when the leapmotion gets new data.
        // pointerTip : array 0..2
        // pointerSpeed : int
        // handLoc : array 0..2
        // palmDir : array 0..2 (normalized)
        // fingerDir : array 0..2 (normalized)
        // For each input, no data if null
        pushData: function(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {
            time = (new Date()).getTime();
            oldData.push({
                time: time,
                pointerTip: pointerTip,
                pointerSpeed: pointerSpeed, 
                handLoc: handLoc, 
                palmDir: palmDir,
                fingerDir: fingerDir
            });

            detectSelect(handLoc);

            if(handLoc !== null && palmDir !== null) {
                detectVolumeChange(handLoc, palmDir);
            }
            detectTempoChange(pointerTip, pointerSpeed, handLoc);
            detectOrchLoc(handLoc, fingerDir);
        },
        onDetectSelectChange: function(callback) {
            detectSelectCallback = callback;
        },
        onDetectVolumeChange: function(callback) {
            detectVolumeChangeCallback = callback;
        },
        onDetectTempoChange: function(callback) {
            detectTempoChangeCallback = callback;
        },
        onDetectOrchLoc: function(callback) {
            detectOrchLocCallback = callback;
        }
    }
})();
