 // EL MAHROSA - .teos Resolver v1.2 - Fixed quotes
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  let url = details.url;
  if (url.includes("google.com/search") && url.includes("teos")) {
    try {
      let q = new URL(url).searchParams.get("q") || "";
      let d = q.split(" ")[0].trim().toLowerCase();
      if (d.endsWith(".teos")) {
        chrome.tabs.update(details.tabId, { url: "https://web4.elmahrosa.org/u/" + d });
        return;
      }
    } catch(e) {}
  }
  try {
    let u = new URL(url);
    if (u.hostname.endsWith(".teos")) {
      chrome.tabs.update(details.tabId, { url: "https://web4.elmahrosa.org/u/" + u.hostname });
    }
  } catch(e) {}
});
