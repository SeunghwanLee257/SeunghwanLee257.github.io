(function(){
  var supported = { ko: true, en: true };

  function getUrlLanguage(){
    var params = new URLSearchParams(window.location.search);
    var lang = params.get("lang");
    return supported[lang] ? lang : null;
  }

  function getStoredLanguage(){
    try{
      var lang = localStorage.getItem("lang");
      return supported[lang] ? lang : null;
    }catch(e){
      return null;
    }
  }

  function inferLanguage(){
    var languages = [navigator.language].concat(navigator.languages || []).filter(Boolean);
    if(languages.some(function(lang){ return /^ko\b/i.test(lang); })) return "ko";
    try{
      if(Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Seoul") return "ko";
    }catch(e){}
    return "en";
  }

  function setAttrCopy(selector, attrName, setter){
    document.querySelectorAll(selector).forEach(function(el){
      var value = el.getAttribute(attrName);
      if(value !== null) setter(el, value);
    });
  }

  function applyLanguage(lang){
    if(!supported[lang]) lang = "en";
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("data-lang", lang);

    document.querySelectorAll("[data-copy-ko][data-copy-en]").forEach(function(el){
      var value = el.getAttribute("data-copy-" + lang);
      if(value !== null) el.innerHTML = value;
    });

    setAttrCopy("[data-placeholder-ko][data-placeholder-en]", "data-placeholder-" + lang, function(el, value){
      el.setAttribute("placeholder", value);
    });

    setAttrCopy("[data-aria-ko][data-aria-en]", "data-aria-" + lang, function(el, value){
      el.setAttribute("aria-label", value);
    });

    document.querySelectorAll(".lang-toggle-btn").forEach(function(btn){
      var active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    try{ localStorage.setItem("lang", lang); }catch(e){}
    document.dispatchEvent(new CustomEvent("page:language-changed", { detail: { lang: lang } }));
  }

  function initLanguage(){
    var initial = getUrlLanguage() || getStoredLanguage() || inferLanguage();
    document.querySelectorAll(".lang-toggle-btn").forEach(function(btn){
      btn.addEventListener("click", function(){
        applyLanguage(btn.getAttribute("data-lang"));
      });
    });
    applyLanguage(initial);
  }

  function initDropdowns(){
    var dropdowns = Array.prototype.slice.call(document.querySelectorAll(".nav-dropdown"));
    dropdowns.forEach(function(dropdown){
      var btn = dropdown.querySelector(".nav-dropdown-btn");
      var menu = dropdown.querySelector(".nav-dropdown-menu");
      if(!btn || !menu) return;
      if(dropdown.getAttribute("data-nav-dropdown-bound") === "true" || btn.getAttribute("data-nav-dropdown-bound") === "true") return;
      dropdown.setAttribute("data-nav-dropdown-bound", "true");
      btn.setAttribute("data-nav-dropdown-bound", "true");
      btn.addEventListener("click", function(event){
        event.stopPropagation();
        dropdowns.forEach(function(other){
          if(other !== dropdown){
            other.classList.remove("is-open");
            var otherBtn = other.querySelector(".nav-dropdown-btn");
            if(otherBtn) otherBtn.setAttribute("aria-expanded", "false");
          }
        });
        var open = dropdown.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      menu.querySelectorAll("a").forEach(function(link){
        link.addEventListener("click", function(){
          dropdown.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
        });
      });
    });

    document.addEventListener("click", function(){
      dropdowns.forEach(function(dropdown){
        dropdown.classList.remove("is-open");
        var btn = dropdown.querySelector(".nav-dropdown-btn");
        if(btn) btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initSidebar(){
    var sidebar = document.getElementById("sidebarMenu");
    var btn = document.querySelector(".header-menu-btn");
    if(!sidebar || !btn) return;

    function setOpen(open){
      sidebar.classList.toggle("is-open", open);
      sidebar.setAttribute("aria-hidden", open ? "false" : "true");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("sidebar-open", open);
    }

    btn.addEventListener("click", function(event){
      event.stopPropagation();
      setOpen(!sidebar.classList.contains("is-open"));
    });

    sidebar.querySelectorAll("a").forEach(function(link){
      link.addEventListener("click", function(){ setOpen(false); });
    });

    document.addEventListener("keydown", function(event){
      if(event.key === "Escape") setOpen(false);
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    initLanguage();
    initDropdowns();
    initSidebar();
  });
})();
