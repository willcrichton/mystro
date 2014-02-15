$(function() {
    var ctl = new Leap.Controller({enableGestures: true});
    var swiper = ctl.gesture('swipe');
    swiper.update(function(g) {
        // do things here
    });
    
    ctl.connect();
});
