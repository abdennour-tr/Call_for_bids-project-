import requests
from bs4 import BeautifulSoup

def scrape_equipement_gov_ma():
    url = "http://appels-offres.equipement.gov.ma/recherche/criteres.aspx"
    response = requests.get(url, timeout=10)
    soup = BeautifulSoup(response.content, "html.parser")

    offres = []
    table = soup.find("table", id="TabC1_all_GV")

    if not table:
        return []

    rows = table.find_all("tr")[1:]  # Ignorer l’en-tête

    for row in rows:
        cols = row.find_all("td")
        if len(cols) < 10:
            continue

        numero_ao = cols[2].get_text(strip=True)
        reference = cols[3].get_text(strip=True)
        objet = cols[4].get_text(strip=True)
        estimation = cols[5].get_text(strip=True)
        caution = cols[6].get_text(strip=True)  # Tu peux l’ajouter si besoin
        date_ouverture = cols[7].get_text(strip=True)
        ville = cols[8].get_text(strip=True)

        offres.append({
            "site": "equipement.gov.ma",
            "numero_ao": reference if reference else numero_ao,
            "rubrique": "",
            "date_publication": "",
            "objet": objet,
            "entite": "Ministère de l'Équipement",
            "etat": estimation,
            "lieu": ville,
            "date_ouverture": date_ouverture,
            "avis_link": url,
            "dossier_link": ""
        })

    return offres

