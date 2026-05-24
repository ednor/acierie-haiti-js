document.addEventListener("DOMContentLoaded", () => {
  const yearTarget = document.getElementById("currentYear");
  if (yearTarget) yearTarget.textContent = new Date().getFullYear();

  initSmartNavbar();
  initRevealAnimations();
  initCounters();
  initBackToTop();
  initProductExperience();
  initProjectModal();
  initContactForm();
  initQuoteRequestForm();
});

function initSmartNavbar() {
  const navbar = document.querySelector(".smart-navbar");
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle("navbar-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach((item) => observer.observe(item));
}

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) return;
  const animate = (el) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.dataset.played) {
        entry.target.dataset.played = "true";
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach((counter) => observer.observe(counter));
}

function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  const onScroll = () => btn.classList.toggle("is-visible", window.scrollY > 350);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initProductExperience() {
  const productSearch = document.getElementById("productSearch");
  const productFilter = document.getElementById("productFilter");
  const cards = Array.from(document.querySelectorAll(".project-card[data-name]"));
  const emptyState = document.getElementById("productEmptyState");
  const cartPanel = document.getElementById("quoteCartPanel");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const openCartBtn = document.getElementById("openCart");
  const closeCartBtn = document.getElementById("closeCart");
  const cartItemsWrap = document.getElementById("cartItems");
  const cartEmpty = document.getElementById("cartEmpty");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const sendCartToContact = document.getElementById("sendCartToContact");
  const sendCartWhatsApp = document.getElementById("sendCartWhatsApp");
  const STORAGE_KEY = "acierie_cart";

  if (!cards.length) return;

  const formatHTG = (value) => `${Number(value).toLocaleString("fr-FR")} HTG`;
  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  };
  const saveCart = (cart) => localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));

  const updateProducts = () => {
    const term = (productSearch?.value || "").trim().toLowerCase();
    const filter = productFilter?.value || "all";
    let visible = 0;
    cards.forEach((card) => {
      const matchTerm = (card.dataset.search || "").includes(term);
      const matchFilter = filter === "all" || card.dataset.category === filter;
      const show = matchTerm && matchFilter;
      card.parentElement.classList.toggle("d-none", !show);
      if (show) visible += 1;
    });
    if (emptyState) emptyState.classList.toggle("d-none", visible !== 0);
  };

  const openCart = () => {
    if (!cartPanel || !cartBackdrop) return;
    cartPanel.classList.add("is-open");
    cartBackdrop.classList.add("is-open");
    cartPanel.setAttribute("aria-hidden", "false");
  };
  const closeCart = () => {
    if (!cartPanel || !cartBackdrop) return;
    cartPanel.classList.remove("is-open");
    cartBackdrop.classList.remove("is-open");
    cartPanel.setAttribute("aria-hidden", "true");
  };

  const renderCart = () => {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (cartCount) cartCount.textContent = count;
    if (cartTotal) cartTotal.textContent = formatHTG(total);

    if (!cartItemsWrap || !cartEmpty) return;
    if (!cart.length) {
      cartItemsWrap.innerHTML = "";
      cartEmpty.classList.remove("d-none");
    } else {
      cartEmpty.classList.add("d-none");
      cartItemsWrap.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
          <h6>${item.name}</h6>
          <p class="small-muted mb-0">Prix indicatif : ${formatHTG(item.price)}</p>
          <div class="cart-item-actions">
            <span class="fw-semibold">Quantité : ${item.qty}</span>
            <strong>${formatHTG(item.qty * item.price)}</strong>
          </div>
          <button type="button" class="cart-remove mt-2" data-remove-index="${index}">Retirer</button>
        </div>
      `).join("");
      cartItemsWrap.querySelectorAll("[data-remove-index]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const next = getCart();
          next.splice(Number(btn.dataset.removeIndex), 1);
          saveCart(next);
          renderCart();
        });
      });
    }

    const contactMessage = buildCartMessage(cart);
    if (sendCartToContact) {
      sendCartToContact.href = cart.length ? `contact.html?cart=${encodeURIComponent(contactMessage)}` : "contact.html";
    }
    if (sendCartWhatsApp) {
      const phone = "50928140000";
      sendCartWhatsApp.href = cart.length
        ? `https://wa.me/${phone}?text=${encodeURIComponent(contactMessage)}`
        : `https://wa.me/${phone}`;
    }
  };

  const buildCartMessage = (cart) => {
    if (!cart.length) return "";
    const lines = cart.map((item) => `- ${item.name}, quantité ${item.qty}, ${formatHTG(item.price)} l'unité`);
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    return `Bonjour, je souhaite obtenir plus d'informations sur cette sélection :\n${lines.join("\n")}\nTotal estimatif : ${formatHTG(total)}.`;
  };

  cards.forEach((card) => {
    const minus = card.querySelector('[data-qty="minus"]');
    const plus = card.querySelector('[data-qty="plus"]');
    const input = card.querySelector(".qty-input");
    const addBtn = card.querySelector(".add-to-cart");
    minus?.addEventListener("click", () => {
      input.value = Math.max(1, Number(input.value || 1) - 1);
    });
    plus?.addEventListener("click", () => {
      input.value = Math.min(999, Number(input.value || 1) + 1);
    });
    addBtn?.addEventListener("click", () => {
      const cart = getCart();
      const name = card.dataset.name;
      const price = Number(card.dataset.price || 0);
      const qty = Math.max(1, Number(input?.value || 1));
      const existing = cart.find((item) => item.name === name);
      if (existing) existing.qty += qty;
      else cart.push({ name, price, qty });
      saveCart(cart);
      renderCart();
      openCart();
      addBtn.textContent = "Ajouté";
      setTimeout(() => addBtn.textContent = "Ajouter à la demande", 1200);
    });
  });

  productSearch?.addEventListener("input", updateProducts);
  productFilter?.addEventListener("change", updateProducts);
  openCartBtn?.addEventListener("click", openCart);
  closeCartBtn?.addEventListener("click", closeCart);
  cartBackdrop?.addEventListener("click", closeCart);

  updateProducts();
  renderCart();
}

function initProjectModal() {
  const modalEl = document.getElementById("projectDetailsModal");
  if (!modalEl) return;
  const title = document.getElementById("projectDetailsModalLabel");
  const text = document.getElementById("projectDetailsText");
  const list = document.getElementById("projectDetailsList");
  const meta = document.getElementById("projectDetailsMeta");
  document.querySelectorAll("[data-project]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = JSON.parse(btn.dataset.project);
      title.textContent = data.title || "Projet";
      text.textContent = data.text || "";
      meta.textContent = data.meta || "";
      list.innerHTML = (data.items || []).map((item) => `<li>${item}</li>`).join("");
    });
  });
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const message = document.getElementById("message");
  const messageCount = document.getElementById("messageCount");
  const status = document.querySelector(".form-status");
  if (!form) return;

  const syncCartMessage = () => {
    const params = new URLSearchParams(window.location.search);
    const cartMessage = params.get("cart");
    if (cartMessage && message && !message.value.trim()) message.value = cartMessage;
  };

  const updateCount = () => {
    if (message && messageCount) {
      const len = message.value.length;
      messageCount.textContent = `${len} / 600 caractères`;
    }
  };

  const validateField = (field) => {
    let valid = true;
    if (field.hasAttribute("required") && !field.value.trim()) valid = false;
    if (valid && field.type === "email" && field.value.trim()) {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
    }
    if (valid && field.id === "message") {
      valid = field.value.trim().length >= 10;
    }
    field.classList.toggle("is-invalid", !valid);
    return valid;
  };

  syncCartMessage();
  updateCount();
  message?.addEventListener("input", updateCount);

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) validateField(field);
    });
  });

  form.addEventListener("submit", (event) => {
    const fields = form.querySelectorAll("input, select, textarea");
    let isValid = true;
    fields.forEach((field) => {
      if (!validateField(field)) isValid = false;
    });
    if (!isValid) {
      event.preventDefault();
      if (status) status.textContent = "Merci de vérifier les champs obligatoires avant l'envoi.";
      return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi en cours...";
    }
    if (status) status.textContent = "Le formulaire est prêt à être envoyé.";
  });
}


function initQuoteRequestForm() {
  const form = document.getElementById("quoteRequestForm");
  const details = document.getElementById("quoteDetails");
  const detailsCount = document.getElementById("quoteDetailsCount");
  const status = document.querySelector("#quoteFormStatus .form-status");
  const summaryCard = document.getElementById("quoteSummaryCard");
  const summaryContent = document.getElementById("quoteSummaryContent");
  if (!form) return;

  const syncCartMessage = () => {
    const params = new URLSearchParams(window.location.search);
    const cartMessage = params.get("cart");
    if (cartMessage && details && !details.value.trim()) details.value = cartMessage;
  };

  const updateCount = () => {
    if (details && detailsCount) {
      const len = details.value.length;
      detailsCount.textContent = `${len} / 800 caractères`;
    }
  };

  const validateField = (field) => {
    let valid = true;
    if (field.hasAttribute("required") && !field.value.trim()) valid = false;
    if (valid && field.type === "email" && field.value.trim()) {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
    }
    if (valid && field.id === "quoteDetails") {
      valid = field.value.trim().length >= 15;
    }
    field.classList.toggle("is-invalid", !valid);
    return valid;
  };

  syncCartMessage();
  updateCount();
  details?.addEventListener("input", updateCount);

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) validateField(field);
    });
  });

  form.addEventListener("submit", (event) => {
    const fields = form.querySelectorAll("input, select, textarea");
    let isValid = true;
    fields.forEach((field) => {
      if (!validateField(field)) isValid = false;
    });

    if (!isValid) {
      event.preventDefault();
      if (status) status.textContent = "Merci de compléter correctement les champs requis avant l'envoi.";
      return;
    }

    const data = new FormData(form);
    if (summaryCard && summaryContent) {
      summaryContent.innerHTML = `
        <p class="mb-2"><strong>Client :</strong> ${data.get("nom") || "Non précisé"}</p>
        <p class="mb-2"><strong>Entreprise :</strong> ${data.get("entreprise") || "Non précisée"}</p>
        <p class="mb-2"><strong>Matériau principal :</strong> ${data.get("materiau_principal") || "Non précisé"}</p>
        <p class="mb-2"><strong>Quantité :</strong> ${data.get("quantite") || "Non précisée"}</p>
        <p class="mb-2"><strong>Délai souhaité :</strong> ${data.get("delai") || "Non précisé"}</p>
        <p class="mb-0"><strong>Lieu :</strong> ${data.get("lieu") || "Non précisé"}</p>
      `;
      summaryCard.classList.remove("d-none");
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi en cours...";
    }
    if (status) status.textContent = "La demande de devis est prête à être envoyée.";
  });
}
