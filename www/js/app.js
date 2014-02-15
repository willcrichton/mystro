$(function() {
    var ctl = new Leap.Controller({enableGestures: true});

    ctl.on('frame', function(frame){
        if(frame.pointables.length > 0 || frame.hands.length > 0)
        {
            var hands = frame.hands.filter(function(elem){return (elem.tools.length == 0)});
    	    var tools = frame.tools; //.filter(function(elem){return (elem.tools.length > 0)});
            if(tools.length > 0)
            {
                var pointerTip = tools[0].stabilizedTipPosition;
                var pointerSpeed = tools[0].tipVelocity;
            }
            else
            {
                var pointerTip = null;
                var pointerSpeed = null;
            }
            if(hands.length > 0)
            {
                var spherePos = hands[0].sphereCenter;
                var palmPos = hands[0].palmPosition;
                var handLoc = hands[0].stabilizedPalmPosition;
                var palmDir = $V(spherePos).subtract($V(palmPos)).elements;
                var palmVelocity = hands[0].palmVelocity;
                var fingerDir = hands[0].direction;
            }
            else
            {
                var handLoc = null;
                var palmDir = null;
                var palmVelocity = null;
                var fingerDir = null;
            }

            dataProcessing.pushData(hands, pointerTip, pointerSpeed, handLoc, palmVelocity, fingerDir);
        }
    });
    ctl.connect();
    
    // Score scrolling
    /*var counter = 0;
    counter += 420;
    $('#score').animate({scrollTop: counter}, 200);*/

    var context = new webkitAudioContext();
    
    function load(path, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', 'audio/' + path, true);
        request.responseType = 'arraybuffer';
        
        request.onload = function() {
            context.decodeAudioData(request.response, function(buffer) {
                callback(path, buffer);
            });
        }

        request.send();
    }

    function linearRange (a, b, y, z, c) {
        var x = (c - a) * (z - y) / (b - a) + y;
        return x;
    };

    var sounds = ['zelda1.wav', 'zelda2.wav', 'zelda3.wav', 'zelda4.wav'];
    var buffers = [];
    var sources = [];
    var gains = [];
    var counter = 0;

    var processor = context.createJavaScriptNode(2048, 1, 1);
    var shifter = new Pitchshift(2048, context.sampleRate, 'FFT');
    var pitchShift = 0.33;
    processor.onaudioprocess = function(event) {
        for (var channel = 0; channel < event.outputBuffer.numberOfChannels; channel++) {
            var output = event.outputBuffer.getChannelData(channel);
            var input = event.inputBuffer.getChannelData(channel);
            
            var shift = linearRange(0, 1, -12, 12, pitchShift);
            var shift_value = pitchShift * 1.5 + 0.5; //Math.pow(1.0595, Math.round(shift));
            shifter.process(shift_value, input.length, 4, input);
            for (var j = 0; j < output.length; j++) {
                output[j] = shifter.outdata[j];
            }
        }
    };
    processor.connect(context.destination);

    function onLoad(path, buffer) {
        buffers[sounds.indexOf(path)] = buffer;

        counter++;
        if (counter != sounds.length) return;

        buffers.forEach(function(buffer, i) {
            var source = context.createBufferSource();
            source.buffer = buffer;

            var gain = context.createGainNode();
            gain.connect(processor);
            source.connect(gain);
            gain.gain.value = 0.0;

            sources[i] = source;
            gains[i] = gain;
        });
    }

    sounds.forEach(function(path) { load(path, onLoad); });

    $('.instrument').click(function() {
        var node = gains[$(this).index()];
        node.gain.value = 1.0;

        $(this).addClass('active');
    });

    $('#play').click(function() {
        $('#play').fadeOut(function() {
            $('#main').fadeIn(function() {
                sources.forEach(function(source) {
                    source.start(0);
                });
            });
        });
    });

    $(document).click(function() {
        if ($('#main').is(':visible')) {
            var inc = 0.5;
            pitchShift *= 0.3;
            sources.forEach(function(source) {
                source.playbackRate.value += inc;
            });
        }
    });

    dataProcessing.onDetectVolumeChange(function(delta) {

        gains.forEach(function(node, i) {
            node.gain.value = clamp(node.gain.value + delta * 3, 0, 3.0);
            setVolumeFill(i);
        });
    });

    dataProcessing.onDetectOrchLoc(function(pair) {
        var x = pair[0], y = pair[1];
        /*if (y < 0.4) {
            $('.instrument').removeClass('hover');
            return;
        }*/

        var len = $('.instrument').length;
        $('.instrument').removeClass('hover');
        //console.log(x, y, len, Math.floor(len * x));
        $($('.instrument')[Math.floor(len * x)]).addClass('hover');
    });

    var time = new Date().getTime();
    var frames = [];
    var NUM_FRAMES = 5;
    dataProcessing.onDetectTempoChange(function() {
        var cur = new Date().getTime();

        if (frames.length == NUM_FRAMES) frames.pop();
        frames.unshift(1 / (cur - time) * 1000 * 60);
        time = cur;

        var avg = 0;
        frames.forEach(function(bpm) {
            avg += bpm;
        });

        avg /= frames.length;

        console.log(avg, frames);

        sources.forEach(function(source) {
            //source.playbackRate.value = avg / 72;
        });
    });

    dataProcessing.onDetectSelectChange(function() {
        //console.log('Selected!');
    });
});
