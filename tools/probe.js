(function(){
  var PROPS = ["display","position","width","height","margin-top","margin-right","margin-bottom","margin-left","padding-top","padding-right","padding-bottom","padding-left","color","background-color","background-image","font-family","font-size","font-weight","line-height","text-align","text-decoration-line","border-top-width","border-right-width","border-bottom-width","border-left-width","border-top-color","border-top-style","border-radius","flex-direction","justify-content","align-items","gap","grid-template-columns","overflow-x","overflow-y","object-fit","vertical-align","max-width","max-height","min-height","top","left","right","bottom","z-index","white-space","letter-spacing","text-transform","box-shadow"];
  var out = [];
  var els = document.querySelectorAll("*");
  for (var i=0;i<els.length;i++){
    var e = els[i];
    var t = e.tagName;
    if (t==="SCRIPT"||t==="STYLE"||t==="LINK"||t==="META"||t==="TITLE"||t==="HEAD") continue;
    var cs = getComputedStyle(e);
    var r = e.getBoundingClientRect();
    var line = (out.length)+"|"+t+"|"+Math.round(r.width)+"x"+Math.round(r.height);
    for (var p=0;p<PROPS.length;p++){ line += "|" + cs.getPropertyValue(PROPS[p]); }
    out.push(line);
  }
  var pre = document.createElement("pre");
  pre.id = "__probe__";
  pre.textContent = out.join("\n");
  document.documentElement.innerHTML = "";
  document.documentElement.appendChild(pre);
})();
