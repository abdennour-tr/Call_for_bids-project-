const advancedSearchHTML = `
<form id="Recherche_Avancee">
  <fieldset>
    <legend>Critères avancés</legend>

    <label>
      Choisir le site :
      <select name="site" id="advancedSiteSelect">
        <option value="finances">Ministère des Finances</option>
        <option value="credit_agricole">Crédit Agricole</option>
        <option value="equipement">Ministère de l'Équipement</option>
      </select>
    </label>

    <!-- Finances -->
    <div class="site-fields finances">
      <label>
        Numéro AO :
        <input type="text" name="numero_ao" />
      </label>
      <label>
        Rubrique :
        <input type="text" name="rubrique" />
      </label>
      <label>
        Entité :
        <input type="text" name="entite_finances" />
      </label>
      <label>
        Date ouverture (ex: dd/mm/yyyy) :
        <input type="input" name="date_ouverture_finances" />
      </label>
    </div>

    <!-- Crédit Agricole -->
    <div class="site-fields credit_agricole">
      <label>
        Référence :
        <input type="text" name="reference_text" />
      </label>
      <label>
        Entité :
        <input type="text" name="entite_ca" />
      </label>
      <label>
        Publication (ex: Du 11/08/2025 Au 05/09/2025) :
        <input type="text" name="publication" placeholder="Du jj/mm/aaaa Au jj/mm/aaaa" />
      </label>
      <label>
        Lieu :
        <input type="text" name="lieu_ca" />
      </label>
    </div>

    <!-- Équipement -->
    <div class="site-fields equipement">
      <label>
        Entité :
        <input type="text" name="entite_equipement" />
      </label>
      <label>
        Lieu :
        <input type="text" name="lieu_equipement" />
      </label>
      <label>
        Date ouverture (ex: dd/mm/yyyy) :
        <input type="input" name="date_ouverture_equipement" />
      </label>
      <label>
        Estimation :
        <input type="text" name="estimation" />
      </label>
    </div>

    <button type="submit">Rechercher</button>
  </fieldset>
</form>
`;

// Afficher la recherche avancée au clic
document.getElementById("toggleAdvanced").addEventListener("click", () => {
  const formContainer = document.querySelector(".advancedSearchForm");
  formContainer.innerHTML = advancedSearchHTML;
  document.querySelector(".ongleFlottante").style.display = "block";

  const mainSiteSelect = document.getElementById("source");
  const advancedSiteSelect = formContainer.querySelector("#advancedSiteSelect");

  if (mainSiteSelect && advancedSiteSelect) {
    // Si dans la recherche principale on a "all", on choisit "finances" par défaut
    advancedSiteSelect.value =
      mainSiteSelect.value === "all" ? "finances" : mainSiteSelect.value;
  }

  toggleSiteFields(advancedSiteSelect.value);

  advancedSiteSelect.addEventListener("change", (e) => {
    toggleSiteFields(e.target.value);
  });

  // Gérer la soumission du formulaire avancé
  const advForm = document.getElementById("Recherche_Avancee");
  advForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(advForm);
    const site = formData.get("site");

    let criteria = { site };

    if (site === "finances") {
      criteria.numero_ao = formData.get("numero_ao") || "";
      criteria.rubrique = formData.get("rubrique") || "";
      criteria.entite = formData.get("entite_finances") || "";
      criteria.date_ouverture = formData.get("date_ouverture_finances") || "";
    } else if (site === "credit_agricole") {
      criteria.reference_text = formData.get("reference_text") || "";
      criteria.entite = formData.get("entite_ca") || "";
      criteria.publication = formData.get("publication") || "";
      criteria.lieu = formData.get("lieu_ca") || "";
    } else if (site === "equipement") {
      criteria.entite = formData.get("entite_equipement") || "";
      criteria.lieu = formData.get("lieu_equipement") || "";
      criteria.date_ouverture = formData.get("date_ouverture_equipement") || "";
      criteria.estimation = formData.get("estimation") || "";
    }

    performAdvancedSearch(criteria);
  });
});

// Fermer la fenêtre avancée
document.querySelector(".cancel").addEventListener("click", () => {
  document.querySelector(".ongleFlottante").style.display = "none";
});

// Affiche uniquement les champs du site sélectionné
function toggleSiteFields(selectedSite) {
  const allSiteDivs = document.querySelectorAll(".site-fields");
  allSiteDivs.forEach((div) => {
    div.style.display = div.classList.contains(selectedSite) ? "block" : "none";
  });
}

// Fonction pour appeler le backend avec les critères et afficher les résultats
async function performAdvancedSearch(criteria) {
  try {
    const response = await fetch("/scrape_advanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(criteria),
    });

    if (!response.ok) {
      throw new Error(
        `Erreur serveur: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!Array.isArray(data.results) || data.results.length === 0) {
      alert("Aucun résultat trouvé pour ces critères.");
      return;
    }

    // Mets à jour les résultats globaux et affiche la page 1
    currentResults = data.results;
    displayPage(1);

    // Ferme la fenêtre avancée
    document.querySelector(".ongleFlottante").style.display = "none";
  } catch (err) {
    alert("Erreur lors de la recherche avancée : " + err.message);
    console.error(err);
  }
}
