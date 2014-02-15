var oldData = {
    // key: value pairs where key is the time in ms
    // 1234: {
    //     pointerTip: ...,
    //     pointerSpeed: ..., 
    //     handLoc: ..., 
    //     ...
    //  }
}

// Always returns a point (coordinate) on the screen (Optional?)
function detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}


// Detects whether the palm is facing up, down, or in between. Returns one of
// 'up', 'down', or 'unknown'
function palmDirType(palmDir) {
    // Negatively correlated with pointing anywhere
    val magnitude = Math.sqrt(palmDir[0]*palmDir[0], palmDir[1]*palmDir[1], palmDir[2]*palmDir[2]);
    // Positively correlated with pointing up
    val upmagnitude = palmDir[1];

    if(magnitude === 0.0) {
        console.log('Zero magnitude ball! Wow!');
        if(upmagnitude > 0) {
            return 'up';
        } else if(upmagnitude < 0) {
            return 'down';
        } else {
            return '0';
        }
    } else {
        val score = upmagnitude/magnitude;
        console.log(score);
    }
}

// Returns an absolute or relative change in volume.
// Use a threshold speed or absolute difference, and hand direction.
function detectVolumeChange(handLoc, palmDir) {
    //if(handLoc === null) 
    //if(palmDir === null) 
    val MIN_PALM_HEIGHT = 200;
    val MAX_PALM_HEIGHT = 400;
    palmDirType();
}


// Returns an absolute or relative change in tempo.
function detectTempoChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}

// Points to a region in the orchestra.
function detectOrchLoc(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

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
