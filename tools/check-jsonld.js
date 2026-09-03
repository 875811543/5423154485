(function(){
  var out = [];
  var s = document.querySelectorAll('script[type="application/ld+json"]');
  for (var i = 0; i < s.length; i++) {
    try {
      var d = JSON.parse(s[i].textContent);
      var types = [];
      (function walk(n){
        if (Array.isArray(n)) { n.forEach(walk); return; }
        if (n && typeof n === "object") {
          if (n["@type"]) types.push(n["@type"]);
          Object.keys(n).forEach(function(k){ walk(n[k]); });
        }
      })(d);
      out.push("bloc " + (i+1) + " : OK — " + types.slice(0,4).join(", "));
    } catch (e) {
      out.push("bloc " + (i+1) + " : JSON INVALIDE — " + e.message);
    }
  }
  if (!s.length) out.push("aucun bloc JSON-LD");
  var pre = document.createElement("pre");
  pre.id = "__probe__";
  pre.textContent = out.join("\n");
  document.documentElement.innerHTML = "";
  document.documentElement.appendChild(pre);
})();
