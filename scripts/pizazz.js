'use strict';

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Pizazz = factory());
}(this, function () {

var cache = [];

var ranColor = function() {
  return `rgb(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)})`;
};

var getColors = function(amt) {
  var results = [];
  for(var i = 0; i < amt; i++) {
    results.push(ranColor());
  }
  return results;
};

var getCanvas = function() {
  if(cache.length > 0) {
    var shifted = cache[0];
    cache.shift();
    return shifted;
  }
  else {
    return document.createElement('canvas');
  }
};

var Pizazz = function(args) {
  this.size = args.size;
  this.buffer = args.buffer;
  this.spacing = args.spacing;
  this.length = args.length;
  this.speed = args.speed;
  this.stroke = args.stroke;
  this.strokeWidth = args.strokeWidth;
};

Pizazz.prototype.play = function(target, d) {
  var canvas = getCanvas();
  var dimensions = target.getBoundingClientRect();
  var dpr = window.devicePixelRatio || 1;
  var size = this.size;
  var buffer = size - this.buffer;
  var spacing = this.spacing;
  var length = this.length || 0;
  var speed = this.speed;
  var stroke = this.stroke;
  var strokeWidth = this.strokeWidth;
  var delay = d || 0;
  var styles = `
    position: absolute;
    left: ${dimensions.left + window.scrollX - size}px;
    top: ${dimensions.top + window.scrollY - size}px;
    height: ${dimensions.height+(size*2)}px;
    width: ${dimensions.width+(size*2)}px;
    overflow: hidden;
    pointer-events: none;
    border-radius: ${dimensions.height+size/2}px;
    z-index: 99999999;
  `;
  if(canvas.style.cssText !== styles) {
    canvas.setAttribute('style', styles);
  }
  canvas.height = (dimensions.height+(size*2))*dpr;
  canvas.width = (dimensions.width+(size*2))*dpr;
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  var vHeight = dimensions.height+(size*2);
  var vWidth = dimensions.width+(size*2);
  var heightInt = Math.floor(vHeight/spacing);
  var widthInt = Math.floor(vWidth/spacing);
  var heightRem = dimensions.height % spacing;
  var widthRem = dimensions.width % spacing;
  var totalInt = heightInt*2 + widthInt*2;
  var frame = 0;
  ctx.lineWidth = strokeWidth;

  var draw = function() {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    for (var i = 0; i < totalInt; i++){
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      if (i < heightInt){
        var y1 = spacing*(i)+size+(heightRem/2);
        if(y1 <= dimensions.height+size){
          ctx.moveTo(buffer, y1);
          ctx.lineTo(-length+buffer, y1);
          ctx.stroke();
        }
      }
      else if (i < heightInt + widthInt){
        var x1 = spacing*(i-heightInt)+size+(widthRem/2);
        if(x1 <= dimensions.width+size) {
          ctx.moveTo(x1, vHeight-buffer);
          ctx.lineTo(x1, vHeight-buffer+length);
          ctx.stroke();
        }
      }
      else if (i < heightInt*2 + widthInt){
        var y2 = spacing*(i - (heightInt + widthInt)) + size+(heightRem/2);
        if(y2 <= dimensions.height + size) {
          ctx.moveTo(vWidth - buffer, y2);
          ctx.lineTo(vWidth - buffer + length, y2);
          ctx.stroke();
        }
      }
      else {
        var x2 = spacing*(i - (totalInt-widthInt)) + (size+(widthRem/2));
        if(x2 <= dimensions.width+size) {
          ctx.moveTo(x2, buffer);
          ctx.lineTo(x2, -length+buffer);
          ctx.stroke();
        }
      }
    }
    if(frame <= speed*16) {
      requestAnimationFrame(draw);
      length += (1 * (buffer - length) * (0.25/speed));
    }
    else {
      buffer -= (1 * buffer * (0.25/speed));
      if(frame < speed*32) {
        requestAnimationFrame(draw);
      }
      else {
        cache.unshift(canvas);
        canvas.remove();
        canvas = null;
        return;
      }
    }
    frame++;
  };

  setTimeout(function() {
    draw();
  }, delay);
};

return Pizazz;
}));
