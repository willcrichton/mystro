var dataProcessing = (function() {
    var oldData = {
        // key: value pairs where key is the time in ms
        // 1234: {
        //     pointerTip: ...,
        //     pointerSpeed: ..., 
        //     handLoc: ..., 
        //     ...
        //  }
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


    // Always returns a point (coordinate) on the screen (Optional?)
    function detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {
        // This doesn't have callbacks registered.
    }


    // Detects whether the palm is facing up, down, or in between. Returns one of
    // 'up', 'down', or 'unknown'
    function palmDirType(palmDir) {
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
                return '0';
            }
        } else {
            var score = upmag/mag;
            //console.log('Score = ' + score);
        }
    }

    // Returns an absolute or relative change in volume.
    // Use a threshold speed or absolute difference, and hand direction.
    function detectVolumeChange(handLoc, palmDir) {
        if(palmDir === undefined) {
            throw new Error('There isn\'t a palmDir!');
        }
        //if(handLoc === null) 
        //if(palmDir === null) 
        var MIN_PALM_HEIGHT = 200;
        var MAX_PALM_HEIGHT = 400;
        palmDirType(palmDir);
        detectVolumeChangeCallback(null);
    }


    // Returns an absolute or relative change in tempo.
    function detectTempoChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {
        detectTempoChangeCallback(null);
    }

    // Points to a region in the orchestra.

    // Implementation: 

    function detectRecentHandLoc(){
        var LEFTEDGE = -300; 
        var TOPEDGE = 400;
        return [LEFTEDGE, TOPEDGE];
    }

    function detectOrchLoc(handLoc, fingerDir) {
        // Constants for determining edges

        var RIGHTEDGE = 50;
        var LEFTEDGE = -300; 
        var BOTTOMEDGE = 200;
        var TOPEDGE = 400;
        var DEPTH =  20;         //variable

        // USE OLD DATA 
        if(handLoc === null){
            handLoc = detectRecentHandLoc()
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


        var finalHandLoc = [fingerX + fingerLocNorm[0]*DEPTH, fingerY + fingerLocNorm[1]*DEPTH];
	var test = [(finalHandLoc[0]), finalHandLoc[1]]
	var finalNormedLoc = [(finalHandLoc[0] - LEFTEDGE)/(RIGHTEDGE-LEFTEDGE), 
                  (finalHandLoc[1] - BOTTOMEDGE)/(TOPEDGE-BOTTOMEDGE)];

	console.log(test)
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
            oldData[time] = {
                 pointerTip: pointerTip,
                 pointerSpeed: pointerSpeed, 
                 handLoc: handLoc, 
                 palmDir: palmDir,
                 fingerDir: fingerDir
            }

            detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);

            if(handLoc !== null && palmDir !== null) {
                detectVolumeChange(handLoc, palmDir);
            }
            detectTempoChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
            detectOrchLoc(handLoc, fingerDir);
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
