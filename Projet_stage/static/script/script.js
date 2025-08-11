const RESULTS_PER_PAGE = 8;
let currentResults = [];
let currentPage = 1;

function createOffreHTML(offre) {
  let detailsHTML = "";

  if (offre.rubrique && offre.rubrique.trim() !== "") {
    detailsHTML += `<p><strong>Rubrique :</strong> ${offre.rubrique}</p>`;
  }

  detailsHTML += `<p><strong>Objet :</strong><br/>${
    offre.objet || "<em>Aucun objet disponible</em>"
  }</p>`;

  if (offre.date_publication && offre.date_publication.trim() !== "") {
    detailsHTML += `<p><strong>Publication :</strong> ${offre.date_publication}</p>`;
  }

  detailsHTML += `<p><strong>Entité :</strong> ${offre.entite || "N/A"}</p>`;

  if (offre.lieu && offre.lieu.trim() !== "") {
    detailsHTML += `<p><strong>Lieu :</strong> ${offre.lieu}</p>`;
  }

  if (offre.date_ouverture && offre.date_ouverture.trim() !== "") {
    detailsHTML += `<p><strong>Date ouverture :</strong> ${offre.date_ouverture}</p>`;
  }

  if (offre.etat && offre.etat.trim() !== "") {
    detailsHTML += `<p><strong>État / Estimation :</strong> ${offre.etat}</p>`;
  }

  if (offre.contact && offre.contact.trim() !== "") {
    detailsHTML += `<p><strong>Contact :</strong> ${offre.contact}</p>`;
  }

  let linksHTML = "";
  if (offre.dossier_link) {
    linksHTML += `<a class="offre-link" href="${offre.dossier_link}" target="_blank" rel="noopener noreferrer">📄 Consulter le dossier</a>`;
  }
  if (
    offre.avis_link &&
    (!offre.dossier_link || offre.avis_link !== offre.dossier_link)
  ) {
    if (linksHTML !== "") linksHTML += "<br/>";
    linksHTML += `<a class="offre-link" href="${offre.avis_link}" target="_blank" rel="noopener noreferrer">🔗 Voir l'avis</a>`;
  }

  return `
    <div class="offre-card">
      <h3>${offre.numero_ao || "N° Non disponible"}</h3>
      ${detailsHTML}
      <div>${linksHTML}</div>
    </div>
  `;
}

function displayPage(page) {
  currentPage = page;
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  const start = (page - 1) * RESULTS_PER_PAGE;
  const end = start + RESULTS_PER_PAGE;
  const pageResults = currentResults.slice(start, end);

  if (pageResults.length === 0) {
    resultsDiv.innerHTML = "<p>Aucun résultat sur cette page.</p>";
    return;
  }

  pageResults.forEach((offre) => {
    const div = document.createElement("div");
    div.className = "result";
    div.innerHTML = createOffreHTML(offre);
    resultsDiv.appendChild(div);
  });

  createPagination(page, Math.ceil(currentResults.length / RESULTS_PER_PAGE));
}

function createPagination(current, totalPages) {
  const resultsDiv = document.getElementById("results");

  const oldPagination = document.getElementById("pagination");
  if (oldPagination) oldPagination.remove();

  if (totalPages <= 1) return;

  const paginationDiv = document.createElement("div");
  paginationDiv.id = "pagination";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Précédent";
  prevBtn.disabled = current === 1;
  prevBtn.addEventListener("click", () => {
    if (current > 1) displayPage(current - 1);
  });
  paginationDiv.appendChild(prevBtn);

  function pageBtn(page) {
    const btn = document.createElement("button");
    btn.textContent = page;
    btn.disabled = page === current;
    if (page === current) {
      btn.style.backgroundColor = "#1e3a8a";
      btn.style.color = "white";
      btn.style.cursor = "default";
    }
    btn.addEventListener("click", () => displayPage(page));
    return btn;
  }

  let left = current - 2;
  let right = current + 2;

  if (left < 1) {
    right += 1 - left;
    left = 1;
  }
  if (right > totalPages) {
    left -= right - totalPages;
    right = totalPages;
    if (left < 1) left = 1;
  }

  paginationDiv.appendChild(pageBtn(1));

  if (left > 2) {
    const dots = document.createElement("span");
    dots.textContent = "...";
    dots.className = "dots";
    paginationDiv.appendChild(dots);
  }

  for (let i = left; i <= right; i++) {
    if (i !== 1 && i !== totalPages) {
      paginationDiv.appendChild(pageBtn(i));
    }
  }

  if (right < totalPages - 1) {
    const dots = document.createElement("span");
    dots.textContent = "...";
    dots.className = "dots";
    paginationDiv.appendChild(dots);
  }

  if (totalPages > 1) {
    paginationDiv.appendChild(pageBtn(totalPages));
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Suivant";
  nextBtn.disabled = current === totalPages;
  nextBtn.addEventListener("click", () => {
    if (current < totalPages) displayPage(current + 1);
  });
  paginationDiv.appendChild(nextBtn);

  resultsDiv.appendChild(paginationDiv);
}

function getAdvancedCriteria(form) {
  const criteria = {};
  const site = form.querySelector("select[name='site']").value;

  // Sélectionner uniquement les champs visibles pour ce site
  const visibleFields = form.querySelectorAll(
    `.site-fields.${site} input, .site-fields.${site} select`
  );

  visibleFields.forEach((input) => {
    if (input.value && input.value.trim() !== "") {
      criteria[input.name] = input.value.trim();
    }
  });

  criteria.site = site;
  return criteria;
}

document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const keyword = document.getElementById("keyword").value.trim();
  const source = document.getElementById("source").value;
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = "<p>Chargement...</p>";
  currentResults = [];
  currentPage = 1;

  // Vérifier si la recherche avancée est ouverte
  const advancedForm = document.querySelector(".advancedSearchForm form");
  let advancedCriteria = null;

  if (advancedForm) {
    advancedCriteria = getAdvancedCriteria(advancedForm);
  }

  try {
    let allOffres = [];

    // Construction des params selon recherche simple ou avancée
    const params = new URLSearchParams();

    // Keyword dans tous les cas
    if (keyword) {
      params.append("keyword", keyword);
    }

    // Site choisi (recherche simple ou avancée)
    if (advancedCriteria) {
      params.append("source", advancedCriteria.site);
    } else {
      params.append("source", source);
    }

    // Ajouter critères avancés (sauf site)
    if (advancedCriteria) {
      Object.entries(advancedCriteria).forEach(([key, val]) => {
        if (key !== "site") {
          params.append(key, val);
        }
      });
    }

    // Faire appel à l'API
    const response = await fetch(`/scrape?${params.toString()}`);
    const data = await response.json();

    if (
      data.error ||
      !Array.isArray(data.results) ||
      data.results.length === 0
    ) {
      resultsDiv.innerHTML = "<p>Aucun résultat trouvé.</p>";
      return;
    }

    currentResults = data.results;
    displayPage(1);
  } catch (error) {
    resultsDiv.innerHTML = `<p style="color:red;">Erreur serveur : ${error.message}</p>`;
  }
});
