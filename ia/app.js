(() => {
  "use strict";
  const config = window.SITE_CONFIG;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const money = (amount) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(amount);

  function applyContent() {
    document.title = config.seo.title;
    $("meta[name='description']").content = config.seo.description;
    $("meta[property='og:title']").content = config.seo.title;
    $("meta[property='og:description']").content = config.seo.description;
    $("meta[property='og:image']").content = config.seo.image;
    $("#reviewLabel").textContent = config.status.label;
    $("#reviewNote").textContent = config.status.note;
    $("#brandLogo").src = config.brand.logo;
    $("#heroEyebrow").textContent = config.course.eyebrow;
    $("#heroTagline").textContent = config.course.tagline;
    $("#heroDescription").textContent = config.course.description;
    $("#metaDate").textContent = config.course.dateShort;
    $("#metaSchedule").textContent = config.course.schedule.replaceAll("a. m.", "").replaceAll("p. m.", "");
    $("#metaModality").textContent = config.course.modality;
    $("#metaPrice").textContent = `$${money(config.course.price)} ${config.course.currency}`;
    $("#videoState").textContent = config.video.status;
    $("#videoDescription").textContent = config.video.description;
    $("#speakerName").innerHTML = `${config.speaker.name.replace("Ing. ", "").split(" ").slice(0,2).join(" ").toUpperCase()}<br><em>${config.speaker.name.replace("Ing. ", "").split(" ").slice(2).join(" ").toUpperCase()}</em>`;
    $("#speakerRole").textContent = config.speaker.role;
    $("#speakerBio").innerHTML = config.speaker.bio.map(p => `<p>${p}</p>`).join("");
    $("#speakerDisclaimer").textContent = config.speaker.disclaimer;
    $("#enrollDate").textContent = config.course.dateShort;
    $("#enrollTime").textContent = config.course.schedule;
    $("#ticketPrice").textContent = money(config.course.price);
    $("#checkoutNotice").textContent = config.checkout.notice;
    $("#contactPhone").textContent = config.contact.phone;
    $("#contactEmail").textContent = config.contact.email;
    $("#contactLocation").textContent = config.contact.location;

    $("#valueRows").innerHTML = config.valuePillars.map((item, i) => `
      <article class="value-row reveal" data-delay="${Math.min(i, 3)}">
        <span class="number">${item.number}</span>
        <span class="label">${item.label}</span>
        <h3>${item.title}</h3>
        <p>${item.body}</p>
        <span class="arrow" aria-hidden="true">→</span>
      </article>`).join("");

    $("#programList").innerHTML = config.modules.map((item, index) => {
      const breakMarkup = index === 2 ? `<div class="program-break"><i></i><strong>${config.break.time}</strong><span>${config.break.label}</span></div>` : "";
      return `${breakMarkup}<article class="program-item reveal" data-delay="${Math.min(index, 3)}">
        <button class="program-trigger" type="button" aria-expanded="${index === 0}" aria-controls="module-${index}">
          <span class="program-number">${item.number}</span>
          <span class="program-time">${item.time}</span>
          <span class="program-title">${item.title}</span>
          <span class="program-plus" aria-hidden="true">+</span>
        </button>
        <div class="program-panel" id="module-${index}" aria-hidden="${index !== 0}">
          <div><div class="program-panel-content">
            <ol>${item.topics.map(topic => `<li>${topic}</li>`).join("")}</ol>
            <p class="program-objective"><strong>OBJETIVO DEL MÓDULO</strong>${item.objective}</p>
          </div></div>
        </div>
      </article>`;
    }).join("");
    $(".program-item").classList.add("open");

    $("#outcomeTrack").innerHTML = config.outcomes.map((item, i) => `
      <article class="outcome-card reveal" data-delay="${i % 3}">
        <span class="index">0${i + 1}</span>
        <div><h3>${item[0]}</h3><p>${item[1]}</p></div>
      </article>`).join("");

    $("#audienceGrid").innerHTML = config.course.audience.map((item, i) => `
      <article class="audience-card reveal" data-delay="${i}">
        <span>0${i + 1}</span>
        <div><h3>${item}</h3><p>${audienceCopy(item)}</p></div>
      </article>`).join("");

    $("#faqList").innerHTML = config.faq.map((item, i) => `
      <article class="faq-item reveal">
        <button class="faq-trigger" type="button" aria-expanded="false" aria-controls="faq-${i}">
          <span class="index">0${i + 1}</span><span class="question">${item[0]}</span><span class="plus" aria-hidden="true">+</span>
        </button>
        <div class="faq-answer" id="faq-${i}" aria-hidden="true"><div><p>${item[1]}</p></div></div>
      </article>`).join("");
    $("#pendingList").innerHTML = config.pending.map(item => `<li>${item}</li>`).join("");

    $("#structuredData").textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "EducationEvent",
      name: config.course.title,
      description: config.course.description,
      startDate: "2026-11-27T10:00:00-06:00",
      endDate: "2026-11-27T14:00:00-06:00",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "VirtualLocation", url: config.brand.website },
      organizer: { "@type": "Organization", name: config.brand.name, url: config.brand.website },
      performer: { "@type": "Person", name: config.speaker.name },
      offers: { "@type": "Offer", price: config.course.price, priceCurrency: config.course.currency, availability: "https://schema.org/PreOrder", url: config.brand.website }
    });
  }

  function audienceCopy(label) {
    const copy = {
      "Gerentes": "Procesos, equipos y métricas con una nueva lectura.",
      "Directores": "Criterio para priorizar inversión e impacto.",
      "Líderes": "Herramientas para convertir ideas en iniciativas.",
      "Dueños de negocios": "Una ruta práctica para adoptar IA con control."
    };
    return copy[label] || "Aplicación empresarial con criterio.";
  }

  function setupAccordions() {
    $$(".program-trigger").forEach(trigger => trigger.addEventListener("click", () => {
      const item = trigger.closest(".program-item");
      const willOpen = !item.classList.contains("open");
      $$(".program-item.open").forEach(openItem => {
        openItem.classList.remove("open");
        $(".program-trigger", openItem).setAttribute("aria-expanded", "false");
        $(".program-panel", openItem).setAttribute("aria-hidden", "true");
      });
      if (willOpen) {
        item.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
        $(".program-panel", item).setAttribute("aria-hidden", "false");
      }
    }));
    $$(".faq-trigger").forEach(trigger => trigger.addEventListener("click", () => {
      const item = trigger.closest(".faq-item");
      const open = item.classList.toggle("open");
      trigger.setAttribute("aria-expanded", String(open));
      $(".faq-answer", item).setAttribute("aria-hidden", String(!open));
    }));
  }

  function setupNavigation() {
    const toggle = $("#menuToggle");
    const nav = $("#siteNav");
    const close = () => { toggle.setAttribute("aria-expanded", "false"); nav.classList.remove("open"); document.body.classList.remove("menu-open"); };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
    });
    $$("a", nav).forEach(link => link.addEventListener("click", close));
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  function setupMotion() {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = $$(".reveal");
    if (reduced || !("IntersectionObserver" in window)) reveals.forEach(el => el.classList.add("visible"));
    else {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
      }), { threshold: .12, rootMargin: "0px 0px -7%" });
      reveals.forEach(el => observer.observe(el));
    }
    if (!reduced && matchMedia("(pointer: fine)").matches) {
      const stage = $("#systemStage");
      stage.closest(".decision-system").addEventListener("pointermove", e => {
        const box = stage.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width - .5;
        const y = (e.clientY - box.top) / box.height - .5;
        stage.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 6}deg)`;
      });
      stage.closest(".decision-system").addEventListener("pointerleave", () => stage.style.transform = "");
    }
  }

  function setupScroll() {
    const header = $(".site-header");
    const progress = $("#scrollProgress");
    const onScroll = () => {
      header.classList.toggle("is-fixed", scrollY > 420);
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function setupPreviewActions() {
    const toast = $("#toast");
    const text = $("#toastText");
    let timer;
    const show = message => {
      text.textContent = message;
      toast.classList.add("show");
      clearTimeout(timer);
      timer = setTimeout(() => toast.classList.remove("show"), 7000);
    };
    $("#toastClose").addEventListener("click", () => toast.classList.remove("show"));
    $$(".checkout-trigger").forEach(button => button.addEventListener("click", () => {
      if (config.checkout.enabled && config.checkout.url) location.href = config.checkout.url;
      else show(config.checkout.notice);
    }));
    $("#videoButton").addEventListener("click", () => {
      if (config.video.source) show("El reproductor oficial se abrirá aquí.");
      else show(config.video.description);
    });
  }

  applyContent();
  setupAccordions();
  setupNavigation();
  setupMotion();
  setupScroll();
  setupPreviewActions();
})();
