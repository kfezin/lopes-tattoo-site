const contactRoot = document.body.dataset.root || "..";

function renderFaq(items, config) {
  const container = document.querySelector("[data-faq-list]");
  if (!container) return;
  container.replaceChildren();
  const visibleItems = items.filter((item) => !item.requerFlag || Boolean(config.flags?.[item.requerFlag]));
  visibleItems.forEach((item) => {
    const details = document.createElement("details");
    details.className = "faq-item";
    const summary = document.createElement("summary");
    summary.textContent = item.pergunta;
    const answer = document.createElement("p");
    answer.textContent = item.resposta;
    details.append(summary, answer);
    container.append(details);
  });
}

async function loadFaq(config) {
  const container = document.querySelector("[data-faq-list]");
  if (!container) return;
  try {
    const response = await fetch(`${contactRoot}/data/faq.json`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = await response.json();
    if (!Array.isArray(items)) throw new TypeError("faq.json precisa ser um array");
    renderFaq(items, config);
  } catch (error) {
    console.error("Não foi possível carregar data/faq.json", error);
    container.replaceChildren();
    const errorNote = document.querySelector("[data-faq-error]");
    if (errorNote) errorNote.hidden = false;
  }
}

function formValue(form, name) {
  return String(form.elements.namedItem(name)?.value || "").trim();
}

function setInvalid(input, invalid) {
  if (!input) return;
  input.setAttribute("aria-invalid", String(invalid));
}

function setupForm(config) {
  const form = document.querySelector("[data-brief-form]");
  if (!form) return;
  const errorBox = document.querySelector("[data-form-error]");
  const successBox = document.querySelector("[data-form-success]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    successBox.hidden = true;
    const required = ["nome", "cidade", "regiao", "tamanho", "ideia"];
    let firstInvalid = null;
    required.forEach((name) => {
      const input = form.elements.namedItem(name);
      const invalid = !formValue(form, name);
      setInvalid(input, invalid);
      if (invalid && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      errorBox.hidden = false;
      firstInvalid.focus();
      return;
    }

    const message = [
      config.mensagemWhatsappPadrao || "Olá! Vim pelo site e quero conversar sobre uma tatuagem.",
      "",
      `Nome: ${formValue(form, "nome")}`,
      `Cidade: ${formValue(form, "cidade")}`,
      `Região do corpo: ${formValue(form, "regiao")}`,
      `Tamanho aproximado: ${formValue(form, "tamanho")}`,
      formValue(form, "medida") ? `Medida/observação: ${formValue(form, "medida")}` : "",
      `Ideia: ${formValue(form, "ideia")}`,
      formValue(form, "disponibilidade") ? `Disponibilidade aproximada: ${formValue(form, "disponibilidade")}` : ""
    ].filter((line) => line !== "").join("\n");

    const digits = String(config.whatsapp || "").replace(/\D/g, "");
    if (!digits) {
      errorBox.textContent = "O contato do WhatsApp ainda precisa ser configurado em data/config.json.";
      errorBox.hidden = false;
      return;
    }
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    // Evento de formulário pode ser conectado ao Analytics/Meta Pixel após aprovação; nada é enviado agora.
    const popup = window.open(url, "_blank");
    if (popup) {
      popup.opener = null;
      successBox.hidden = false;
    } else {
      errorBox.textContent = "O navegador bloqueou a nova aba. Use o botão WhatsApp direto ou o botão flutuante.";
      errorBox.hidden = false;
    }
  });

  form.querySelectorAll("input, select, textarea").forEach((input) => {
    input.addEventListener("input", () => setInvalid(input, false));
    input.addEventListener("change", () => setInvalid(input, false));
  });
}

async function initContact() {
  if (!document.querySelector("[data-brief-form]") && !document.querySelector("[data-faq-list]")) return;
  try {
    const config = await (window.LopesSiteConfigPromise || Promise.reject(new Error("Configuração ainda não disponível")));
    if (!config) throw new Error("data/config.json indisponível");
    setupForm(config);
    await loadFaq(config);
  } catch (error) {
    console.error("Configuração de contato indisponível", error);
    const form = document.querySelector("[data-brief-form]");
    if (form) form.hidden = true;
    const fallback = document.querySelector("[data-form-fallback]");
    if (fallback) fallback.hidden = false;
    const faqError = document.querySelector("[data-faq-error]");
    if (faqError) faqError.hidden = false;
  }
}

initContact();
