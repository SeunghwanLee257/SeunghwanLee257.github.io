(function(){
  var teamLinks = [
    { href: "./team.html", i18n: "nav.current", ko: "현재 팀", en: "Current Team" },
    { href: "./alumni.html", i18n: "nav.alumni", ko: "알럼나이", en: "Alumni" }
  ];

  function hasI18nRuntime(){
    return !!document.querySelector("[data-i18n]");
  }

  function makeLink(item, className){
    var link = document.createElement("a");
    link.href = item.href;
    if(className) link.className = className;
    if(hasI18nRuntime()){
      link.setAttribute("data-i18n", item.i18n);
      link.textContent = item.en;
    }else{
      link.setAttribute("data-copy-ko", item.ko);
      link.setAttribute("data-copy-en", item.en);
      link.textContent = item.en;
    }
    return link;
  }

  function renderTeamDropdowns(){
    document.querySelectorAll('[data-dropdown="team"] .nav-dropdown-menu').forEach(function(menu){
      menu.setAttribute("data-shared-nav", "team");
      menu.innerHTML = "";
      teamLinks.forEach(function(item){
        menu.appendChild(makeLink(item));
      });
    });
  }

  function renderSidebarTeamLinks(){
    document.querySelectorAll(".sidebar-menu-nav--main").forEach(function(nav){
      var teamLink = nav.querySelector('a[href="./team.html"]');
      if(!teamLink) return;
      Array.prototype.slice.call(nav.querySelectorAll('a[href="./alumni.html"]')).forEach(function(link){
        link.remove();
      });
      var alumni = makeLink(teamLinks[1], "sidebar-menu-link");
      teamLink.insertAdjacentElement("afterend", alumni);
    });
  }


  function closeDropdown(dropdown){
    var btn = dropdown.querySelector(".nav-dropdown-btn");
    dropdown.classList.remove("is-open");
    if(btn) btn.setAttribute("aria-expanded", "false");
  }

  function initNavDropdowns(){
    var dropdowns = Array.prototype.slice.call(document.querySelectorAll(".nav-dropdown"));

    dropdowns.forEach(function(dropdown){
      var btn = dropdown.querySelector(".nav-dropdown-btn");
      var menu = dropdown.querySelector(".nav-dropdown-menu");
      if(!btn || !menu) return;
      if(dropdown.getAttribute("data-nav-dropdown-bound") === "true") return;

      dropdown.setAttribute("data-nav-dropdown-bound", "true");
      btn.setAttribute("data-nav-dropdown-bound", "true");

      var suppressNextClick = false;

      function toggleDropdown(event){
        if(event){
          event.preventDefault();
          event.stopPropagation();
        }

        dropdowns.forEach(function(other){
          if(other !== dropdown) closeDropdown(other);
        });

        var open = !dropdown.classList.contains("is-open");
        dropdown.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      }

      btn.addEventListener("pointerup", function(event){
        if(event.pointerType === "mouse") return;
        suppressNextClick = true;
        toggleDropdown(event);
        window.setTimeout(function(){ suppressNextClick = false; }, 500);
      });

      btn.addEventListener("click", function(event){
        if(suppressNextClick){
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        toggleDropdown(event);
      });

      menu.querySelectorAll("a").forEach(function(link){
        link.addEventListener("click", function(){
          closeDropdown(dropdown);
        });
      });
    });

    if(!document.documentElement.getAttribute("data-nav-dropdown-document-bound")){
      document.documentElement.setAttribute("data-nav-dropdown-document-bound", "true");
      document.addEventListener("click", function(event){
        document.querySelectorAll(".nav-dropdown.is-open").forEach(function(dropdown){
          if(!dropdown.contains(event.target)) closeDropdown(dropdown);
        });
      });
      document.addEventListener("keydown", function(event){
        if(event.key !== "Escape") return;
        document.querySelectorAll(".nav-dropdown.is-open").forEach(closeDropdown);
      });
    }
  }

  function applySharedNavigation(){
    renderTeamDropdowns();
    renderSidebarTeamLinks();
    initNavDropdowns();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", applySharedNavigation);
  }else{
    applySharedNavigation();
  }
})();
