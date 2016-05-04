var p = document.querySelector('.animate'),
    offset = 1000;

var offsetMe = function() {
  if(offset < 0) offset = 1000;
  p.style.strokeDashoffset = offset;
  offset--;

  requestAnimationFrame(offsetMe);
};

offsetMe();

// -------------------------------

var position = { x: 100, y: 0 }
var tween = new TWEEN.Tween(position);
tween.to({ x: 200 }, 1000).easing( TWEEN.Easing.Elastic.InOut );
tween.start();

tween.to({ x: 200 }, 1000);

animate();
function animate() {
  requestAnimationFrame(animate);
  // [...]
  TWEEN.update();
  // [...]
}

// ---------------------------------

<VelocityComponent animation={{ opacity: isShow ? 1 : 0 }} duration={ 500 } runOnMount={ true }>
  <MySubComponent/>
</VelocityComponent>
