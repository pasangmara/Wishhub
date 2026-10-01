/* ARGUS floating review button — <script src="https://review.argusofficial.com/embed.js" data-argus-slug="your-slug" defer></script> */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var slug = s.getAttribute("data-argus-slug");
  if (!slug || document.getElementById("argus-review-btn")) return;
  var base = new URL(s.src).origin;
  var label = s.getAttribute("data-label") || "Share your experience";
  var color = s.getAttribute("data-color") || "#0b3b2c";
  var pos = s.getAttribute("data-position") === "left" ? "left" : "right";
  var a = document.createElement("a");
  a.id = "argus-review-btn";
  a.href = base + "/r/" + encodeURIComponent(slug) + "?s=website";
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = "★ " + label;
  a.setAttribute(
    "style",
    "position:fixed;bottom:20px;" + pos + ":20px;z-index:2147483000;display:inline-flex;align-items:center;" +
      "padding:12px 20px;border-radius:999px;background:" + color + ";color:#fff;font:600 14px/1.2 system-ui,-apple-system,sans-serif;" +
      "text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,.18);transition:transform .15s ease"
  );
  a.onmouseenter = function () { a.style.transform = "translateY(-2px)"; };
  a.onmouseleave = function () { a.style.transform = ""; };
  (document.body || document.documentElement).appendChild(a);
})();
