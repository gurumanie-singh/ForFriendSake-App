/* Founding Squad: signup, confirm, ideas and unsubscribe.
   Tokens arrive in the URL fragment (#t= / #m=), which browsers never send
   to a server, and are removed from the address bar as soon as they are read. */

const API = "https://us-central1-forfriendsake-6b5d0.cloudfunctions.net/";

async function post(name, payload) {
  try {
    const res = await fetch(API + name, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) return out;
    return { ok: false, error: out.error || "Something went wrong. Try again in a minute." };
  } catch (e) {
    return { ok: false, error: "Couldn’t reach the server. Check your connection and try again." };
  }
}

function takeFragment(key) {
  const params = new URLSearchParams(location.hash.slice(1));
  const value = params.get(key);
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  return { value, params };
}

function setStatus(el, message, isError) {
  el.textContent = message;
  el.classList.toggle("is-error", Boolean(isError));
  el.hidden = !message;
}

function busy(button, label) {
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = Boolean(label);
  button.textContent = label || button.dataset.label;
}

function initSignup() {
  const form = document.getElementById("joinForm");
  if (!form) return;
  const status = document.getElementById("joinStatus");
  const button = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const turnstileToken = data.get("cf-turnstile-response") || "";
    if (!turnstileToken) {
      setStatus(status, "The spam check is still loading. Give it a second and try again.", true);
      return;
    }
    busy(button, "Joining…");
    setStatus(status, "", false);
    const out = await post("communitySubscribe", {
      email: data.get("email"),
      appUsage: data.get("appUsage") || null,
      wantsBeta: data.get("wantsBeta") === "on",
      consent: data.get("consent") === "on",
      ageConfirmed: data.get("age") === "on",
      turnstileToken,
    });
    busy(button, null);
    if (window.turnstile) window.turnstile.reset();
    if (!out.ok) {
      setStatus(status, out.error, true);
      return;
    }
    form.hidden = true;
    setStatus(status, "Almost there. Check your inbox for an email from me and tap Confirm. If it isn’t there in a few minutes, look in spam.", false);
    status.focus();
  });
}

function initConfirm() {
  const button = document.getElementById("confirmButton");
  if (!button) return;
  const status = document.getElementById("confirmStatus");
  const { value: token } = takeFragment("t");
  if (!token) {
    button.hidden = true;
    setStatus(status, "This page needs the link from your confirmation email. Open the email and tap Confirm my email again.", true);
    return;
  }
  button.addEventListener("click", async () => {
    busy(button, "Confirming…");
    const out = await post("communityConfirm", { token });
    if (out.ok && out.manageToken) {
      location.replace("founding-squad.html#welcome=1&m=" + encodeURIComponent(out.manageToken));
      return;
    }
    busy(button, null);
    if (out.ok && out.alreadyConfirmed) {
      button.hidden = true;
      setStatus(status, "You’re already confirmed. Your welcome email has a link for sending ideas.", false);
      return;
    }
    setStatus(status, out.error, true);
  });
}

function initIdeas() {
  const form = document.getElementById("ideaForm");
  if (!form) return;
  const status = document.getElementById("ideaStatus");
  const welcome = document.getElementById("welcomeNote");
  const noToken = document.getElementById("noToken");
  const { value: manageToken, params } = takeFragment("m");
  if (!manageToken) {
    form.hidden = true;
    noToken.hidden = false;
    return;
  }
  if (params.get("welcome") === "1") welcome.hidden = false;
  const button = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    busy(button, "Sending…");
    const out = await post("communityFeedback", {
      manageToken,
      suggestion: data.get("suggestion"),
      creditName: data.get("creditName") || null,
      appUsage: data.get("appUsage") || null,
    });
    busy(button, null);
    if (!out.ok) {
      setStatus(status, out.error, true);
      return;
    }
    form.reset();
    setStatus(status, "Got it, thank you. I read every one. Send another whenever you think of it.", false);
    status.focus();
  });
}

function initUnsubscribe() {
  const button = document.getElementById("unsubscribeButton");
  if (!button) return;
  const status = document.getElementById("unsubscribeStatus");
  const { value: manageToken } = takeFragment("m");
  if (!manageToken) {
    button.hidden = true;
    setStatus(status, "This page needs the unsubscribe link from one of my emails. You can also reply to any email and ask, and I’ll remove you.", true);
    return;
  }
  button.addEventListener("click", async () => {
    busy(button, "Unsubscribing…");
    const out = await post("communityUnsubscribe", { manageToken });
    busy(button, null);
    if (!out.ok) {
      setStatus(status, out.error, true);
      return;
    }
    button.hidden = true;
    setStatus(status, "Done. You won’t get any more emails from the Founding Squad list.", false);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSignup();
  initConfirm();
  initIdeas();
  initUnsubscribe();
});
