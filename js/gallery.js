const siteRoot = document.body.dataset.root || ".";
const postsUrl = `${siteRoot}/data/instagram-posts.json`;
const instagramProfile = "https://www.instagram.com/icarolopes.tattoo/";
let embedScriptPromise = null;

function isPlaceholderUrl(value) {
  return typeof value !== "string" || !value.trim() || value.trim() === "COLAR-LINK-AQUI";
}

function getPublicPostUrl(value) {
  if (isPlaceholderUrl(value)) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname !== "www.instagram.com") return null;
    if (!/^\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) return null;
    return `https://www.instagram.com${url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`}`;
  } catch {
    return null;
  }
}

function makeProfileLink(className = "") {
  const link = document.createElement("a");
  link.className = className;
  link.href = instagramProfile;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Visitar o Instagram do estúdio";
  return link;
}

function showCardFallback(card) {
  card.dataset.embedState = "fallback";
  const shell = card.querySelector("[data-instagram-embed-shell]");
  if (shell) shell.hidden = true;
  const fallback = card.querySelector("[data-instagram-fallback]");
  if (fallback) fallback.hidden = false;
}

function loadOfficialEmbedScript() {
  if (window.instgrm?.Embeds?.process) return Promise.resolve();
  if (embedScriptPromise) return embedScriptPromise;

  embedScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-instagram-embed-loader]");
    const script = existing || document.createElement("script");
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      callback(value);
    };
    const timeoutId = window.setTimeout(() => finish(reject, new Error("Tempo limite do embed do Instagram")), 12000);

    script.addEventListener("load", () => finish(resolve), { once: true });
    script.addEventListener("error", () => finish(reject, new Error("Não foi possível carregar o embed do Instagram")), { once: true });
    if (!existing) {
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.dataset.instagramEmbedLoader = "true";
      document.head.append(script);
    }
  });
  return embedScriptPromise;
}

function addOfficialEmbed(card, post, index) {
  const url = getPublicPostUrl(post.url);
  if (!url || card.dataset.embedState !== "requested") return;

  const blockquote = document.createElement("blockquote");
  blockquote.className = "instagram-media";
  blockquote.setAttribute("data-instgrm-permalink", url);
  blockquote.setAttribute("data-instgrm-version", "14");
  blockquote.setAttribute("aria-label", post.legenda ? `Publicação do Instagram: ${post.legenda}` : `Publicação do Instagram ${index + 1}`);
  blockquote.style.cssText = "background:#fff;border:0;border-radius:0;box-shadow:none;margin:0 auto;max-width:540px;min-width:0;padding:0;width:100%;";

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Ver este trabalho no Instagram";
  blockquote.append(link);

  const shell = card.querySelector("[data-instagram-embed-shell]");
  shell.replaceChildren(blockquote);
  card.dataset.embedState = "loading";

  loadOfficialEmbedScript().then(() => {
    if (!window.instgrm?.Embeds?.process) throw new Error("API oficial de embeds indisponível");
    window.instgrm.Embeds.process();
    window.setTimeout(() => {
      if (!card.querySelector("iframe")) showCardFallback(card);
      else card.dataset.embedState = "loaded";
    }, 12000);
  }).catch(() => showCardFallback(card));
}

function makePostCard(post, index) {
  const article = document.createElement("article");
  article.className = "instagram-card";
  article.dataset.postIndex = String(index + 1);
  article.dataset.embedState = "idle";
  article.setAttribute("aria-label", post.legenda ? `Post do Instagram: ${post.legenda}` : `Post do Instagram ${index + 1}`);

  const shell = document.createElement("div");
  shell.className = "instagram-embed-shell";
  shell.dataset.instagramEmbedShell = "";
  const fallback = document.createElement("div");
  fallback.className = "instagram-fallback";
  fallback.dataset.instagramFallback = "";
  fallback.hidden = true;
  const fallbackLink = document.createElement("a");
  fallbackLink.href = getPublicPostUrl(post.url) || instagramProfile;
  fallbackLink.target = "_blank";
  fallbackLink.rel = "noopener noreferrer";
  fallbackLink.textContent = "Ver este trabalho no Instagram";
  fallback.append(fallbackLink);

  const caption = document.createElement("p");
  caption.className = "instagram-caption";
  caption.textContent = post.legenda || `PUBLICAÇÃO / ${String(index + 1).padStart(2, "0")}`;
  article.append(shell, fallback, caption);

  const postUrl = getPublicPostUrl(post.url);
  if (!postUrl) {
    article.dataset.embedState = "placeholder";
    const note = document.createElement("p");
    note.className = "instagram-placeholder-note";
    note.textContent = "Cole o link público do post no arquivo data/instagram-posts.json.";
    shell.append(note);
  } else {
    article.dataset.embedState = "queued";
    article.dataset.postUrl = postUrl;
    article.dataset.postCaption = post.legenda || "";
  }
  return article;
}

function setupLazyEmbeds(cards) {
  const activate = (card, index) => {
    if (card.dataset.embedState !== "queued") return;
    card.dataset.embedState = "requested";
    addOfficialEmbed(card, { url: card.dataset.postUrl, legenda: card.dataset.postCaption }, index);
  };

  if (!("IntersectionObserver" in window)) {
    cards.forEach((card, index) => activate(card, index));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = Number(entry.target.dataset.postIndex) - 1;
      activate(entry.target, index);
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: "850px 0px" });
  cards.forEach((card) => {
    if (card.dataset.embedState === "queued") observer.observe(card);
  });
}

function showDataError(container) {
  const note = document.createElement("p");
  note.className = "instagram-static-fallback";
  note.append("Não foi possível carregar as publicações agora. ", makeProfileLink());
  container.replaceChildren(note);
  container.setAttribute("aria-busy", "false");
}

async function renderInstagramPosts(container) {
  try {
    const response = await fetch(postsUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || !Array.isArray(data.posts)) throw new TypeError("instagram-posts.json precisa conter uma lista posts");

    const fragment = document.createDocumentFragment();
    const posts = data.posts.slice(0, 30);
    const cards = posts.map(makePostCard);
    cards.forEach((card) => fragment.append(card));
    if (!cards.length) {
      const empty = document.createElement("p");
      empty.className = "instagram-static-fallback";
      empty.textContent = "Adicione links de publicações públicas em data/instagram-posts.json.";
      fragment.append(empty);
    }
    container.replaceChildren(fragment);
    container.setAttribute("aria-busy", "false");
    setupLazyEmbeds(cards);
  } catch (error) {
    console.error("Não foi possível carregar data/instagram-posts.json", error);
    showDataError(container);
  }
}

document.querySelectorAll("[data-instagram-grid]").forEach(renderInstagramPosts);
