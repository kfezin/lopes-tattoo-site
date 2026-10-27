const pageRoot = document.body.dataset.root || ".";
const configUrl = `${pageRoot}/data/config.json`;

function announce(message) {
  const region = document.querySelector("[data-site-message]");
  if (!region) return;
  region.textContent = message;
  region.hidden = false;
}

function valueAtPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

async function loadSiteConfig() {
  try {
    const response = await fetch(configUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const config = await response.json();
    window.LopesSiteConfig = config;

    const businessSchema = document.querySelector("[data-business-schema]");
    if (businessSchema) {
      try {
        const schema = JSON.parse(businessSchema.textContent);
        schema.name = config.nome || schema.name;
        schema.url = new URL(`${pageRoot}/`, window.location.href).href;
        const telephone = String(config.whatsappExibicao || config.whatsapp || "").trim();
        if (telephone) schema.telephone = telephone;
        if (config.instagram) schema.sameAs = [config.instagram];
        const cityName = String(config.cidadeBase || "").replace(/\s*[–-]\s*[^–-]+$/, "").trim();
        if (cityName && schema.areaServed) schema.areaServed.name = cityName;
        businessSchema.textContent = JSON.stringify(schema);
      } catch (error) {
        console.warn("JSON-LD indisponível", error);
      }
    }

    const canonicalPath = window.location.pathname.replace(/index\.html$/, "");
    const canonicalUrl = new URL(canonicalPath || "/", window.location.origin).href;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = canonicalUrl;
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.append(ogUrl);
    }
    ogUrl.content = canonicalUrl;

    if (config.imagemCompartilhamento) {
      const siteBase = new URL(`${pageRoot}/`, window.location.href);
      const imageUrl = new URL(config.imagemCompartilhamento, siteBase).href;
      for (const [selector, key, attribute] of [
        ['meta[property="og:image"]', "property", "og:image"],
        ['meta[name="twitter:image"]', "name", "twitter:image"]
      ]) {
        let imageMeta = document.querySelector(selector);
        if (!imageMeta) {
          imageMeta = document.createElement("meta");
          imageMeta.setAttribute(key, attribute);
          document.head.append(imageMeta);
        }
        imageMeta.content = imageUrl;
      }
    }

    const digits = String(config.whatsapp || "").replace(/\D/g, "");
    const defaultText = config.mensagemWhatsappPadrao || "Olá! Vim pelo site e quero conversar sobre uma tatuagem.";
    document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
      if (!digits) {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        return;
      }
      link.href = `https://wa.me/${digits}?text=${encodeURIComponent(defaultText)}`;
      link.setAttribute("aria-label", `Conversar com ${config.nome || "Lopes Tattoo"} pelo WhatsApp`);
      link.removeAttribute("aria-disabled");
    });

    document.querySelectorAll("[data-instagram-link]").forEach((link) => {
      if (config.instagram) {
        link.href = config.instagram;
        link.setAttribute("aria-label", `Abrir Instagram ${config.instagramUsuario || "do artista"}`);
      } else {
        link.removeAttribute("href");
      }
    });

    document.querySelectorAll("[data-current-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });

    document.querySelectorAll("[data-config]").forEach((node) => {
      const value = valueAtPath(config, node.dataset.config);
      if (typeof value === "string") node.textContent = value;
    });

    document.querySelectorAll("[data-config-text]").forEach((node) => {
      const value = valueAtPath(config, node.dataset.configText);
      if (typeof value === "string") node.textContent = value;
    });

    const otherCities = document.querySelector("[data-other-cities]");
    if (otherCities) otherCities.hidden = !Boolean(config.flags?.mostrarOutrasCidades);

    document.querySelectorAll("[data-address-section]").forEach((section) => {
      section.hidden = !Boolean(config.flags?.mostrarEndereco && config.endereco);
    });

    document.dispatchEvent(new CustomEvent("lopes:config-ready", { detail: config }));
    return config;
  } catch (error) {
    console.error("Não foi possível carregar data/config.json", error);
    announce("Os dados do site não carregaram. Use um servidor local e confira data/config.json.");
    document.dispatchEvent(new CustomEvent("lopes:config-error", { detail: error }));
    throw error;
  }
}

window.LopesSiteConfigPromise = loadSiteConfig().catch(() => null);

function setupMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#primary-nav");
  if (!button || !nav) return;

  const close = () => {
    document.body.classList.remove("menu-open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Abrir menu");
  };
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    document.body.classList.toggle("menu-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (open) nav.querySelector("a")?.focus();
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
      close();
      button.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) close();
  });
}

function setupReveal() {
  document.documentElement.classList.add("js-ready");
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -24px 0px" });
  items.forEach((item) => observer.observe(item));
}

function setupImageFallbacks() {
  document.querySelectorAll(".hero-ornament img").forEach((image) => {
    image.addEventListener("error", () => { image.hidden = true; }, { once: true });
  });
}

setupMenu();
setupReveal();
setupImageFallbacks();

// Analytics deliberadamente não ativado. Quando houver consentimento e IDs aprovados,
// eventos de WhatsApp, Instagram e envio do formulário podem ser conectados aqui.
