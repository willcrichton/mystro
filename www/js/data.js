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

    var MIN_PALM_HEIGHT = 200;
    var MAX_PALM_HEIGHT = 400;
    function normedVol(absoluteVolDelta) {
        return absoluteVolDelta/(MAX_PALM_HEIGHT - MIN_PALM_HEIGHT);
    }

    // Gets the last non-null pair of palmVelocity and handLoc to interpolate 
    // in detectVolumeChange. This could be two functions, one for handLoc and
    // one for palmVelocity, but I think it's rare that we can get one but not
    // the other.
    function lastVolData() {
        for(var i = oldData.length; i >= 0; i++) {
            var elt = oldData[i];
            if(elt.handLoc !== null && elt.palmVelocity != null) {
                return elt;
            }
        }
        return null;
    }

    // Returns change in volume, from -1.0 to 1.0.
    function detectVolumeChange(handLoc, palmVelocity, time) {
        if(palmVelocity === undefined) {
            throw new Error('palmVelocity is undefined!');
        }
        if(handLoc === undefined) {
            throw new Error('handLoc is undefined!');
        }

        if(palmVelocity === null || handLoc === null) {
            var prevGoodData = lastVolData();
            if(prevGoodData === null) {
                console.log('No previous left hand.');
                return;
            }
            var prevTime = (_.last(oldData, 2))[0];
            if(prevTime === undefined || prevTime === null) {
                throw new Error('sadface. need to sleep on this.');
            }
            if(prevTime.time > time) {
                throw new Error('I really hope this never happens. Did it?');
            }

            // Linearly interpolate to guess new volume.
            var result = (time - prevTime.time)*prevGoodData.palmVelocity;
            detectVolumeChangeCallback(normedVol(result));
        } else {
            var moveDirection = palmVelocity[1];
            var thisHeight = handLoc[1];
            var lastHeightElt = getLastHeight();
            if(lastHeightElt === null) {
                console.log('No previous left hand.');
                return;
            }

            var result = null;
            if(moveDirection > 0 && thisHeight > lastHeight) {
                result = thisHeight - lastHeight;
                console.log('up');
            } else if(moveDirection < 0 && thisHeight < lastHeight) {
                result = lastHeight - thisHeight;
                console.log('down');
            }

            if(result !== null) {
                detectVolumeChangeCallback(normedVol(result));
            }
        }
    }


    // Returns an absolute or relative change in tempo.
    function detectTempoChange(pointerTip, pointerSpeed, handLoc, palmVelocity, fingerDir) {
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

        //console.log(test)
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

            detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);

            if(handLoc !== null && palmDir !== null) {
                detectVolumeChange(handLoc, palmDir, time);
            }
            detectTempoChange(pointerTip, pointerSpeed, handLoc, palmVelocity, fingerDir);
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
