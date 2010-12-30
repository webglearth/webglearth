var StartWebGLEarthDemo = function(canvas) {
  var app = new WebGLEarth(canvas);
  
  app.addCustomTP('Local TMS', './natural-earth-III-balanced-001.merc/{z}/{x}/{y}.jpg', 0, 5, 256, true);
  app.addAllBingTPs('AsLurrtJotbxkJmnsefUYbatUuBkeBTzTL930TvcOekeG8SaQPY9Z5LDKtiuzAOu');
  app.addOSMTP();
  app.addMapQuestTP();
  
  app.start();
}