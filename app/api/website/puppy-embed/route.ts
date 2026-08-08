const EMBED_SCRIPT = String.raw`(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var scriptUrl = new URL(script.src, window.location.href);
  var kennel = scriptUrl.searchParams.get("kennel") || script.getAttribute("data-kennel") || "";
  var targetId = script.getAttribute("data-target") || "mydogportal-puppies";
  var root = document.getElementById(targetId);
  if (!root) {
    root = document.createElement("div");
    root.id = targetId;
    if (script.parentNode) script.parentNode.insertBefore(root, script);
  }
  root.classList.add("mdp-puppies-root");
  var apiOrigin = scriptUrl.origin;

  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  function addStyles(primary, accent) {
    root.style.setProperty("--mdp-puppy-primary", primary || "#174f46");
    root.style.setProperty("--mdp-puppy-accent", accent || "#b88a35");
    if (document.getElementById("mydogportal-puppy-styles")) return;
    var style = document.createElement("style");
    style.id = "mydogportal-puppy-styles";
    style.textContent = [
      ".mdp-puppies-root{--mdp-puppy-primary:#174f46;--mdp-puppy-accent:#b88a35;--mdp-puppy-ink:#183a34;--mdp-puppy-muted:#70817b;--mdp-puppy-line:#dbe3df;font-family:inherit;color:var(--mdp-puppy-ink)}",
      ".mdp-puppies-root *{box-sizing:border-box}",
      ".mdp-puppy-shell{display:grid;gap:22px;width:100%}",
      ".mdp-puppy-head{display:grid;gap:7px}",
      ".mdp-puppy-eyebrow{color:var(--mdp-puppy-accent);font-size:11px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}",
      ".mdp-puppy-title{margin:0;color:var(--mdp-puppy-primary);font-size:clamp(28px,5vw,48px);line-height:1.06}",
      ".mdp-puppy-intro{max-width:780px;margin:0;color:var(--mdp-puppy-muted);font-size:14px;line-height:1.65}",
      ".mdp-puppy-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:18px}",
      ".mdp-puppy-grid.compact{grid-template-columns:1fr}",
      ".mdp-puppy-card{overflow:hidden;display:grid;border:1px solid var(--mdp-puppy-line);border-radius:16px;background:#fff;box-shadow:0 9px 30px rgba(25,57,49,.06)}",
      ".mdp-puppy-grid.compact .mdp-puppy-card{grid-template-columns:minmax(180px,280px) minmax(0,1fr)}",
      ".mdp-puppy-photo{aspect-ratio:4/3;overflow:hidden;background:#edf2ef}",
      ".mdp-puppy-photo img{width:100%;height:100%;display:block;object-fit:cover}",
      ".mdp-puppy-placeholder{width:100%;height:100%;min-height:180px;display:grid;place-items:center;color:#8a9993;font-weight:800}",
      ".mdp-puppy-body{display:grid;align-content:start;gap:11px;padding:18px}",
      ".mdp-puppy-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}",
      ".mdp-puppy-name{margin:0;color:var(--mdp-puppy-primary);font-size:23px}",
      ".mdp-puppy-status{padding:5px 8px;border-radius:999px;background:#e7f4ee;color:#216b56;font-size:10px;font-weight:850}",
      ".mdp-puppy-details{display:flex;flex-wrap:wrap;gap:7px;margin:0;padding:0;list-style:none}",
      ".mdp-puppy-details li{padding:6px 8px;border-radius:7px;background:#f4f6f3;color:#536b64;font-size:11px}",
      ".mdp-puppy-price{color:var(--mdp-puppy-primary);font-size:19px;font-weight:850}",
      ".mdp-puppy-apply{display:inline-flex;align-items:center;justify-content:center;min-height:42px;margin-top:3px;padding:0 14px;border-radius:9px;background:var(--mdp-puppy-primary);color:#fff;font-size:12px;font-weight:850;text-decoration:none}",
      ".mdp-puppy-empty{padding:38px;border:1px dashed var(--mdp-puppy-line);border-radius:14px;background:#fafbf8;color:var(--mdp-puppy-muted);text-align:center}",
      ".mdp-puppy-error{padding:14px;border-radius:9px;background:#fff0ee;color:#8c3931;font-size:13px}",
      "@media(max-width:620px){.mdp-puppy-grid.compact .mdp-puppy-card{grid-template-columns:1fr}.mdp-puppy-body{padding:15px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function formatDate(value) {
    if (!value) return "";
    var date = new Date(String(value).length <= 10 ? String(value) + "T12:00:00" : value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function render(payload) {
    var config = payload.config || {};
    addStyles(config.primaryColor, config.accentColor);
    var shell = node("section", "mdp-puppy-shell");
    var head = node("header", "mdp-puppy-head");
    head.appendChild(node("span", "mdp-puppy-eyebrow", payload.kennel && payload.kennel.name ? payload.kennel.name : "Our breeding program"));
    head.appendChild(node("h2", "mdp-puppy-title", config.title || "Available Puppies"));
    head.appendChild(node("p", "mdp-puppy-intro", config.introduction || "Meet our currently available puppies."));
    shell.appendChild(head);
    var puppies = Array.isArray(payload.puppies) ? payload.puppies : [];
    if (!puppies.length) {
      shell.appendChild(node("div", "mdp-puppy-empty", "No puppies are currently listed as available. Please check back for future litters."));
    } else {
      var grid = node("div", "mdp-puppy-grid " + (config.layout === "compact" ? "compact" : "cards"));
      puppies.forEach(function (puppy) {
        var card = node("article", "mdp-puppy-card");
        var photo = node("div", "mdp-puppy-photo");
        if (puppy.photo_url) {
          var img = document.createElement("img");
          img.src = puppy.photo_url;
          img.alt = puppy.name + " puppy";
          img.loading = "lazy";
          photo.appendChild(img);
        } else {
          photo.appendChild(node("div", "mdp-puppy-placeholder", puppy.name));
        }
        card.appendChild(photo);
        var body = node("div", "mdp-puppy-body");
        var top = node("div", "mdp-puppy-top");
        top.appendChild(node("h3", "mdp-puppy-name", puppy.name));
        top.appendChild(node("span", "mdp-puppy-status", "Available"));
        body.appendChild(top);
        var details = node("ul", "mdp-puppy-details");
        if (config.showSex !== false && puppy.sex) details.appendChild(node("li", "", puppy.sex));
        if (config.showColor !== false && puppy.color) details.appendChild(node("li", "", puppy.color));
        if (config.showCoat !== false && puppy.coat_type) details.appendChild(node("li", "", puppy.coat_type));
        if (config.showMarkings !== false && puppy.markings) details.appendChild(node("li", "", puppy.markings));
        if (config.showBirthDate !== false && puppy.birth_date) details.appendChild(node("li", "", "Born " + formatDate(puppy.birth_date)));
        if (details.children.length) body.appendChild(details);
        if (config.showPrice !== false && puppy.price !== null && puppy.price !== undefined) body.appendChild(node("div", "mdp-puppy-price", Number(puppy.price).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })));
        var applicationUrl = config.applicationUrl || ("https://" + kennel + ".mydogportal.site/apply");
        if (applicationUrl) {
          var apply = node("a", "mdp-puppy-apply", config.applicationLabel || "Apply for a Puppy");
          apply.href = applicationUrl;
          apply.target = "_blank";
          apply.rel = "noopener noreferrer";
          body.appendChild(apply);
        }
        card.appendChild(body);
        grid.appendChild(card);
      });
      shell.appendChild(grid);
    }
    root.replaceChildren(shell);
    root.removeAttribute("aria-busy");
    root.dispatchEvent(new CustomEvent("mydogportal:puppies-ready", { detail: payload, bubbles: true }));
  }

  root.setAttribute("aria-busy", "true");
  fetch(apiOrigin + "/api/website/puppies?kennel=" + encodeURIComponent(kennel), { method: "GET", credentials: "omit", cache: "no-store", headers: { accept: "application/json" } })
    .then(function (response) { return response.json().then(function (payload) { if (!response.ok) throw new Error(payload.error || "Unable to load puppies."); return payload; }); })
    .then(render)
    .catch(function (error) { root.removeAttribute("aria-busy"); root.replaceChildren(node("div", "mdp-puppy-error", error && error.message ? error.message : "Unable to load puppies.")); });
})();`;

export async function GET() {
  return new Response(EMBED_SCRIPT, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
    },
  });
}
