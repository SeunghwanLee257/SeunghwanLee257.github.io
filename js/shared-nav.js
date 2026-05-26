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

  function applySharedNavigation(){
    renderTeamDropdowns();
    renderSidebarTeamLinks();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", applySharedNavigation);
  }else{
    applySharedNavigation();
  }
})();
