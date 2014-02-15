var oldData = {
    // key: value pairs where key is the time in ms
    // 1234: {
    //     pointerTip: ...,
    //     pointerSpeed: ..., 
    //     handLoc: ..., 
    //     ...
    //  }
}

// Gets the magnitude of a number vector with 0..2 indices
function magnitude3(vec) {
    return Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]);
}


// Always returns a point (coordinate) on the screen (Optional?)
function detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}


// Detects whether the palm is facing up, down, or in between. Returns one of
// 'up', 'down', or 'unknown'
function palmDirType(palmDir) {
    // Negatively correlated with pointing anywhere
    var mag = magnitude3(palmDir);
    // Positively correlated with pointing up
    var upmag = palmDir[1];

    if(mag === 0.0) {
        console.log('Zero magnitude ball! Wow!');
        if(upmag > 0) {
            return 'up';
        } else if(upmag < 0) {
            return 'down';
        } else {
            return '0';
        }
    } else {
        var score = upmag/mag;
        console.log(score);
    }
}

// Returns an absolute or relative change in volume.
// Use a threshold speed or absolute difference, and hand direction.
function detectVolumeChange(handLoc, palmDir) {
    //if(handLoc === null) 
    //if(palmDir === null) 
    var MIN_PALM_HEIGHT = 200;
    var MAX_PALM_HEIGHT = 400;
    palmDirType();
}


// Returns an absolute or relative change in tempo.
function detectTempoChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

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
    var DEPTH =  50;         //variable

    // USE OLD DATA 
    if(handLoc === NULL){
	handLoc = detectRecentHandLoc()
    }
    var handX = handLoc[0];
    var handY = handLoc[1];

    if(fingerLoc === NULL){
	fingerLoc === [0, 0, 1];
    }

    var fingerX = fingerLoc[0];
    var fingerY = fingerLoc[1];
    var fingerNorm = Math.sqrt(fingerX, fingerX + fingerY+fingerY);
    if(fingerNorm === 0){
	var fingerLocNorm = 0;
    }
    else{
	var fingerLocNorm = [fingerX/fingerNorm, 
			      fingerY/fingerNorm];
    }

    var finalHandLoc = [fingerX + fingerLocNorm*DEPTH, fingerY + fingerLocNorm*DEPTH];
    var finalNormedLoc = [(fingerHandLoc[0] - LEFTEDGE)/(RIGHTEDGE-LEFTEDGE), 
			  (fingerHandLoc[1] - BOTTOMEDGE)/(TIOEDGE-BOTTOMEDGE)];

    return finalNormedLoc;
}

// Called when the leapmotion gets new data.
// pointerTip : array 0..2
// pointerSpeed : int
// handLoc : array 0..2
// palmDir : array 0..2 (normalized)
// fingerDir : array 0..2 (normalized)
// For each input, no data if null
function pushData(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {
    time = (new Date()).getTime();
    oldData[time] = {
         pointerTip: pointerTip,
         pointerSpeed: pointerSpeed, 
         handLoc: handLoc, 
         palmDir: palmDir,
         fingerDir: fingerDir
    }

    detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    detectVolumeChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    detectTempoChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    detectOrchLoc(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
}
