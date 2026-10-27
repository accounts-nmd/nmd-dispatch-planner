// =====================================================================
//  NMD Dispatch Planner – Firebase bridge
//  Gives the app the small API it used on claude.ai:
//    claude.use("db")        -> Cloud Firestore (shared data)
//    claude.use("user")      -> simple permission stub
//    claude.use("downloads") -> normal browser download (Excel / PDF)
//  and window.nmdFB, which links each app login (admin, planner, nmd…)
//  to its own Firebase account behind the scenes.
//  No changes needed here. Settings live in firebase-config.js.
// =====================================================================
(function () {
  "use strict";
  var cfg = window.NMD_FIREBASE_CONFIG || {};
  var configured = cfg.apiKey && !/^PASTE/.test(cfg.apiKey);
  var DOMAIN = "nmd-dispatch.app";            // internal only – not a real mailbox
  var resolveReady, ready = new Promise(function (r) { resolveReady = r; });
  var fs = null, auth = null;

  function email(u, g) { return String(u).toLowerCase() + "+" + (g || 1) + "@" + DOMAIN; }
  function fbPass(p) { return "nmd65|" + p; } // Firebase needs 6+ characters
  function parse(user) {
    if (!user || !user.email) return null;
    var local = user.email.split("@")[0], i = local.lastIndexOf("+");
    return i < 0 ? null : { u: local.slice(0, i), gen: +local.slice(i + 1) || 1 };
  }

  function message(title, text) {
    var d = document.createElement("div");
    d.setAttribute("style", "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:#0d2a4a;font-family:system-ui,sans-serif");
    d.innerHTML = '<div style="background:#fff;border-radius:14px;padding:24px;max-width:420px"><h2 style="margin:0 0 8px"></h2><p style="margin:0;color:#556"></p></div>';
    d.querySelector("h2").textContent = title;
    d.querySelector("p").textContent = text;
    document.body.appendChild(d);
  }

  function start() {
    if (!configured) { message("Setup needed", "Open firebase-config.js and paste your Firebase project settings (see README)."); return; }
    try {
      firebase.initializeApp(cfg);
      fs = firebase.firestore();
      fs.settings({ ignoreUndefinedProperties: true, merge: true });
      auth = firebase.auth();
      // Signed in only for this browser tab, like the app's own login
      auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(function () {});
    } catch (e) { message("Setup problem", "Firebase couldn't start: " + (e && e.message || e)); return; }
    resolveReady();
  }

  window.nmdFB = {
    ready: ready,
    signIn: function (u, p, g) { return ready.then(function () { return auth.signInWithEmailAndPassword(email(u, g), fbPass(p)); }); },
    signOut: function () { return ready.then(function () { return auth.signOut(); }); },
    current: function () { return auth ? parse(auth.currentUser) : null; },
    onAuth: function (fn) { ready.then(function () { auth.onAuthStateChanged(function (x) { fn(parse(x)); }); }); },
    // Creates the Firebase account for an app login without signing the Admin out.
    // Returns the account number used (a password reset uses the next number).
    create: function (u, p, g0) {
      return ready.then(async function () {
        var sec = firebase.apps.filter(function (a) { return a.name === "nmdSec"; })[0] || firebase.initializeApp(cfg, "nmdSec");
        var sa = sec.auth();
        for (var g = g0 || 1; g < (g0 || 1) + 40; g++) {
          try { await sa.createUserWithEmailAndPassword(email(u, g), fbPass(p)); await sa.signOut(); return g; }
          catch (e) { if (!e || e.code !== "auth/email-already-in-use") throw e; }
        }
        throw { code: "too-many-resets" };
      });
    },
    changeOwn: function (p) { return auth.currentUser.updatePassword(fbPass(p)); },
    key: function (u, g) { return String(u).toLowerCase() + "+" + (g || 1); }
  };

  var downloads = {
    save: function (r) {
      return new Promise(function (res) {
        var blob = r.data instanceof Blob ? r.data : new Blob([r.data]);
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = r.filename || "download";
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        res({ status: "saved" });
      });
    }
  };
  var user = { can: function () { return Promise.resolve(true); }, isOwner: function () { return false; }, canEdit: function () { return true; } };

  window.claude = {
    use: function (name) {
      if (name === "downloads") return Promise.resolve(downloads);
      if (name === "user") return Promise.resolve(user);
      if (name === "db") return ready.then(function () { return fs; });
      return Promise.resolve(null);
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
