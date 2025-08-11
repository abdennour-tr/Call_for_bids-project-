from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from scrapers.finances import scrape_finances_gov_ma
from scrapers.credit_agricole import scrape_credit_agricole_ma
from scrapers.equipement import scrape_equipement_gov_ma

app = Flask(__name__)
CORS(app)

SOURCES = {
    "finances": scrape_finances_gov_ma,
    "credit_agricole": scrape_credit_agricole_ma,
    "equipement": scrape_equipement_gov_ma
}

def filter_by_keyword(offres, keyword):
    if not keyword:
        return offres
    keyword = keyword.lower()
    return [
        offre for offre in offres
        if any(keyword in str(value).lower() for value in offre.values())
    ]

def filter_advanced(offres, criteria):
    """
    Filtre les offres selon les critères avancés passés en dict.
    Exemple de critères : numero_ao, rubrique, entite, date_ouverture, etc.
    Ne filtre que les champs non vides dans criteria.
    """

    def match_critere(offre, critere, valeur):
        if not valeur:
            return True
        valeur = valeur.lower().strip()
        champ_val = str(offre.get(critere, "")).lower()
        # Pour date, on peut envisager un match exact ou un début de chaîne
        return valeur in champ_val

    filtered = []
    for offre in offres:
        ok = True
        for critere, valeur in criteria.items():
            if critere == "site":
                # on ignore, utilisé pour choisir le scraper
                continue
            if not match_critere(offre, critere, valeur):
                ok = False
                break
        if ok:
            filtered.append(offre)
    return filtered

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scrape')
def scrape():
    keyword = request.args.get('keyword', '').strip()
    source = request.args.get('source', 'finances').strip()

    if source != "all" and source not in SOURCES:
        return jsonify({"error": f"Source inconnue : {source}"}), 400

    try:
        all_offres = []
        if source == "all":
            for src_name, scraper_func in SOURCES.items():
                offres = scraper_func()
                filtered = filter_by_keyword(offres, keyword)
                all_offres.extend(filtered)
        else:
            offres = SOURCES[source]()
            all_offres = filter_by_keyword(offres, keyword)

        return jsonify({
            "source": source,
            "total": len(all_offres),
            "results": all_offres
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/scrape_advanced', methods=['POST'])
def scrape_advanced():
    try:
        criteria = request.get_json()
        if not criteria or 'site' not in criteria:
            return jsonify({"error": "Paramètre 'site' obligatoire"}), 400

        site = criteria['site']
        if site not in SOURCES:
            return jsonify({"error": f"Source inconnue : {site}"}), 400

        # Appel du scraper correspondant
        offres = SOURCES[site]()

        # Filtrage avancé selon critères non vides
        filtered_offres = filter_advanced(offres, criteria)

        return jsonify({
            "source": site,
            "total": len(filtered_offres),
            "results": filtered_offres
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
