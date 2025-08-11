import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime

def parse_objet_contact(excerpt):
    objet = ""
    date_ouverture = ""
    contact = ""

    paragraphs = excerpt.find_all("p")

    for i, p in enumerate(paragraphs):
        text = p.get_text(strip=True)

        if "Objet:" in text:
            # On prend le texte du paragraphe juste après "Objet:"
            if i + 1 < len(paragraphs):
                objet = paragraphs[i + 1].get_text(strip=True)

        elif "Date et heure" in text:
            if i + 1 < len(paragraphs):
                date_ouverture = paragraphs[i + 1].get_text(strip=True)

        elif "Contact" in text:
            contacts = []
            for c in paragraphs[i + 1:]:
                c_text = c.get_text(strip=True)
                if c_text == "":
                    break
                contacts.append(c_text)
            contact = "\n".join(contacts)

    return objet, date_ouverture, contact


def parse_publication_dates(date_text):
    # Exemple date_text : "Du 11/08/2025 Au 26/08/2025"
    pattern = r"Du (\d{2}/\d{2}/\d{4}) Au (\d{2}/\d{2}/\d{4})"
    match = re.search(pattern, date_text)
    if match:
        try:
            date_debut = datetime.strptime(match.group(1), "%d/%m/%Y")
            date_fin = datetime.strptime(match.group(2), "%d/%m/%Y")
            return date_debut, date_fin
        except ValueError:
            return None, None
    return None, None


def scrape_credit_agricole_ma():
    url = "https://www.creditagricole.ma/fr/appel-offres"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers, timeout=10)
    soup = BeautifulSoup(response.content, "html.parser")

    offres = []
    articles = soup.find_all("article", class_="card")

    for article in articles:
        reference = article.find("div", class_="vactory-tender__field-vactory-reference")
        reference_text = reference.get_text(strip=True) if reference else ""

        date_block = article.find("p", class_="card-date")
        date_text = date_block.get_text(strip=True) if date_block else ""

        objet = ""
        date_ouverture = ""
        contact = ""

        excerpt = article.find("div", class_="card-excerpt")
        if excerpt:
            objet, date_ouverture, contact = parse_objet_contact(excerpt)

        date_debut_pub, date_fin_pub = parse_publication_dates(date_text)

        offres.append({
            "site": "credit_agricole",
            "numero_ao": reference_text,
            "date_publication": date_text,
            "date_debut_publication": date_debut_pub,
            "date_fin_publication": date_fin_pub,
            "objet": objet or "Aucun objet disponible",
            "entite": "Crédit Agricole",
            "etat": "",
            "lieu": "Rabat",
            "date_ouverture": date_ouverture,
            "avis_link": url,
            "dossier_link": "",
            "contact": contact or "Non spécifié"
        })

    return offres
