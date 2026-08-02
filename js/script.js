// =============================================================
// CepView — script.js
// Busca bidirecional de CEP/endereço usando a API pública ViaCEP
// =============================================================

(function () {
  "use strict";

  // ---------- Elementos ----------
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const headerNav = document.getElementById("header-nav");

  // ---------- Tema (Light / Dark) — roda em todas as páginas ----------
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("cepview-theme", theme);
  }

  function initTheme() {
    const saved = localStorage.getItem("cepview-theme");
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const current = root.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  initTheme();

  // ---------- Menu mobile (hambúrguer) — roda em todas as páginas ----------
  if (menuToggle && headerNav) {
    menuToggle.addEventListener("click", function () {
      const isOpen = headerNav.classList.toggle("header__nav--open");
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // ---------- A partir daqui: apenas para a página de busca (index.html) ----------
  const tabCep = document.getElementById("tab-cep");
  const tabAddress = document.getElementById("tab-address");
  const fieldsCep = document.getElementById("fields-cep");
  const fieldsAddress = document.getElementById("fields-address");

  const form = document.getElementById("search-form");
  const submitBtn = document.getElementById("submit-btn");
  const submitLabel = document.getElementById("submit-label");

  const inputCep = document.getElementById("input-cep");
  const inputRua = document.getElementById("input-rua");
  const inputCidade = document.getElementById("input-cidade");
  const inputUf = document.getElementById("input-uf");

  const errorCep = document.getElementById("error-cep");
  const errorRua = document.getElementById("error-rua");
  const errorCidade = document.getElementById("error-cidade");
  const errorUf = document.getElementById("error-uf");

  const results = document.getElementById("results");
  const emptyState = document.getElementById("empty-state");
  const emptyStateText = document.getElementById("empty-state-text");

  if (!form) return; // nas demais páginas (Quem somos, Contato, Termos...) o script para aqui

  let mode = "cep"; // 'cep' | 'address'

  // ---------- Alternância de abas ----------
  function switchMode(next) {
    mode = next;
    results.innerHTML = "";
    results.appendChild(emptyState);

    if (next === "cep") {
      tabCep.classList.add("tab--active");
      tabCep.setAttribute("aria-selected", "true");
      tabAddress.classList.remove("tab--active");
      tabAddress.setAttribute("aria-selected", "false");
      fieldsCep.classList.remove("fields--hidden");
      fieldsAddress.classList.add("fields--hidden");
      submitLabel.textContent = "Buscar endereço";
      emptyStateText.textContent = "Digite um CEP para ver rua, bairro, cidade e estado.";
    } else {
      tabAddress.classList.add("tab--active");
      tabAddress.setAttribute("aria-selected", "true");
      tabCep.classList.remove("tab--active");
      tabCep.setAttribute("aria-selected", "false");
      fieldsAddress.classList.remove("fields--hidden");
      fieldsCep.classList.add("fields--hidden");
      submitLabel.textContent = "Buscar CEP";
      emptyStateText.textContent = "Digite rua, cidade e UF para encontrar o CEP.";
    }
    clearFieldErrors();
  }

  tabCep.addEventListener("click", () => switchMode("cep"));
  tabAddress.addEventListener("click", () => switchMode("address"));

  // ---------- Máscara e validação ----------
  function formatCEP(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return digits.slice(0, 5) + "-" + digits.slice(5);
    return digits;
  }

  inputCep.addEventListener("input", function () {
    inputCep.value = formatCEP(inputCep.value);
  });

  inputUf.addEventListener("input", function () {
    inputUf.value = inputUf.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
  });

  function setFieldError(inputEl, errorEl, message) {
    if (message) {
      inputEl.classList.add("field__input--error");
      errorEl.textContent = message;
      errorEl.classList.add("field__error--visible");
    } else {
      inputEl.classList.remove("field__input--error");
      errorEl.textContent = "";
      errorEl.classList.remove("field__error--visible");
    }
  }

  function clearFieldErrors() {
    setFieldError(inputCep, errorCep, "");
    setFieldError(inputRua, errorRua, "");
    setFieldError(inputCidade, errorCidade, "");
    setFieldError(inputUf, errorUf, "");
  }

  function validateCep() {
    const digits = inputCep.value.replace(/\D/g, "");
    const valid = digits.length === 8;
    setFieldError(inputCep, errorCep, valid ? "" : "CEP deve ter 8 dígitos (00000-000)");
    return valid;
  }

  function validateAddress() {
    let valid = true;

    if (inputRua.value.trim().length < 3) {
      setFieldError(inputRua, errorRua, "Digite ao menos 3 caracteres");
      valid = false;
    } else {
      setFieldError(inputRua, errorRua, "");
    }

    if (inputCidade.value.trim().length < 2) {
      setFieldError(inputCidade, errorCidade, "Cidade inválida");
      valid = false;
    } else {
      setFieldError(inputCidade, errorCidade, "");
    }

    if (!/^[A-Za-z]{2}$/.test(inputUf.value)) {
      setFieldError(inputUf, errorUf, "Use a sigla, ex: SP");
      valid = false;
    } else {
      setFieldError(inputUf, errorUf, "");
    }

    return valid;
  }

  // Validação em tempo real (após o usuário começar a digitar)
  inputCep.addEventListener("blur", validateCep);
  inputRua.addEventListener("blur", validateAddress);
  inputCidade.addEventListener("blur", validateAddress);
  inputUf.addEventListener("blur", validateAddress);

  // ---------- Renderização ----------
  function iconHome() {
    return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/></svg>';
  }
  function iconBuilding() {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>';
  }
  function iconPin() {
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  }
  function iconAlert() {
    return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function renderSkeleton(count) {
    results.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "skeleton";
      el.innerHTML = `
        <div class="skeleton__row">
          <div class="skeleton__block" style="width:19px;height:19px;"></div>
          <div style="flex:1;">
            <div class="skeleton__block" style="height:14px;width:70%;margin-bottom:8px;"></div>
            <div class="skeleton__block" style="height:10px;width:45%;"></div>
          </div>
        </div>
        <div class="skeleton__block" style="height:10px;width:50%;margin-bottom:14px;"></div>
        <div class="skeleton__block" style="height:24px;width:110px;border-radius:999px;"></div>
      `;
      results.appendChild(el);
    }
  }

  function renderError(message) {
    results.innerHTML = "";
    const el = document.createElement("div");
    el.className = "error-box";
    el.innerHTML = `${iconAlert()}<span>${escapeHTML(message)}</span>`;
    results.appendChild(el);
  }

  function renderEmpty() {
    results.innerHTML = "";
    results.appendChild(emptyState);
  }

  function renderResults(list) {
    results.innerHTML = "";
    list.forEach(function (item, i) {
      const el = document.createElement("div");
      el.className = "result-card";
      el.style.animationDelay = (i * 60) + "ms";
      el.innerHTML = `
        <div class="result-card__body">
          <div class="result-card__row">
            ${iconHome()}
            <div>
              <div class="result-card__street">${escapeHTML(item.logradouro || "Logradouro não informado")}</div>
              ${item.bairro ? `<div class="result-card__district">${escapeHTML(item.bairro)}</div>` : ""}
            </div>
          </div>
          <div class="result-card__row">
            ${iconBuilding()}
            <span class="result-card__city">${escapeHTML(item.cidade)} · ${escapeHTML(item.uf)}</span>
          </div>
          <div class="result-card__cep">
            ${iconPin()}
            <span>${escapeHTML(item.cep)}</span>
          </div>
        </div>
      `;
      results.appendChild(el);
    });
  }

  // ---------- Busca ----------
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitLabel.textContent = isLoading
      ? "Consultando..."
      : (mode === "cep" ? "Buscar endereço" : "Buscar CEP");
  }

  async function searchByCep(cep) {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (data.erro) {
      renderError("CEP não encontrado. Verifique os números e tente novamente.");
      return;
    }
    renderResults([{
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
    }]);
  }

  async function searchByAddress(uf, cidade, rua) {
    const url = `https://viacep.com.br/ws/${uf}/${encodeURIComponent(cidade)}/${encodeURIComponent(rua)}/json/`;
    const res = await fetch(url);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      renderError("Nenhum endereço encontrado para essa combinação de rua, cidade e UF.");
      return;
    }
    renderResults(data.slice(0, 20).map(function (d) {
      return {
        cep: d.cep,
        logradouro: d.logradouro,
        bairro: d.bairro,
        cidade: d.localidade,
        uf: d.uf,
      };
    }));
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (mode === "cep") {
      if (!validateCep()) return;
      setLoading(true);
      renderSkeleton(1);
      try {
        await searchByCep(inputCep.value.replace(/\D/g, ""));
      } catch (err) {
        renderError("Não foi possível consultar agora. Verifique sua conexão e tente de novo.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!validateAddress()) return;
      setLoading(true);
      renderSkeleton(2);
      try {
        await searchByAddress(inputUf.value, inputCidade.value.trim(), inputRua.value.trim());
      } catch (err) {
        renderError("Não foi possível consultar agora. Verifique sua conexão e tente de novo.");
      } finally {
        setLoading(false);
      }
    }
  });

  // Estado inicial
  renderEmpty();
})();
