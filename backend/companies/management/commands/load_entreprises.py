"""
Importe la liste des entreprises (EIFFAGE, CRBC, CDE, etc.) dans la base.
Usage: python manage.py load_entreprises
Les entreprises existantes (même nom) ne sont pas dupliquées (get_or_create sur le nom).
"""
from django.core.management.base import BaseCommand
from companies.models import Company

# Liste des entreprises : (nom, téléphone, mail, adresse)
ENTREPRISES = [
    (1, "EIFFAGE", "33 839 73 39", "Eiffage-senegal@eiffage.com", "Av. Félix Eboué, Rte des Brasseries"),
    (2, "CRBC", "33 869 99 88", "sen@crb.com", "Immeuble Arezki, Almadies"),
    (3, "CDE", "33 839 59 59", "cde@cde.sn", "Av. F. Eboué / Boulevard Maritime"),
    (4, "ENIKON", "77 645 03 34", "Luka.andrijanic@enikon.com", "Cité Marine K. Massar, Villa 194"),
    (5, "SENAC", "33 842 00 84", "contact@senacpeintures.sn", "16 Av. L. Gueye x Rue Monteil"),
    (6, "HERTZ", "33 889 81 81", "hertz@hertz.sn", "102 Rue Amadou Assane Ndoye"),
    (7, "GCA GLOBAL CONSTRUCTION AFRIC", "33 832 52 05", "gcdakar@globalconstructionafrique.com", "Hann Marinas, Cité ISRA 2"),
    (8, "SENECAR TOUR", "33 859 77 77", "senecar@orange.sn", "Rte A. L. S. Senghor, Keur Yoff"),
    (9, "AB CONSTRUCTION", "33 864 70 49", "abconstruction@orange.sn", "Fann, Av. Cheikh Anta Diop"),
    (10, "COSELEC", "33 839 02 50", "coselec.sn (web)", "Rocade Fann / Bel Air, 13500"),
    (11, "CARITAS", "33 822 37 60 / 33823 82 43", "secretariatnational@caritassenegal.org", "Av. Cheikh Anta Diop, Dakar"),
    (12, "AGEROUTE", "33 869 07 51", "ageroute@ageroute.sn", "Fann Résidence"),
    (13, "AREZKI", "33 869 90 99", "arezkigroup.com (web)", "Ngor Almadies, Lot 6"),
    (14, "KOB LOGISTICS SARL", "77 608 18 63 / 77 204 26 82", "obklogistics.sn@outlook.com", "Lot. Djily Mbaye, Parcelle 315"),
    (15, "FONDASOL", "33 864 02 64", "senegal@groupefondasol.com", "Cité Sonatél, Villa 28"),
    (16, "CEREEQ", "33 831 00 04 / 33 831 00 05", "cereeq@orange.sn", "ROUTE FRONT DE TERRE, HANN"),
    (17, "DIAMA TECHNOLOGY", "33 842 04 44", "contact@diamatech-sa.com", "Av. Lamine Gueye"),
    (18, "CCC COMPAGNY", "77 366 09 09", "contact@ccc.sn", "Immeuble Bienal Home, Rte Aéroport, Virage"),
    (19, "SELOV", "33 827 57 26", "selov@selov.sn", "Cité Sipres 2 VDN, Villa 102"),
    (20, "LOCASEN", "33 867 86 85", "locasen@grouplocasen.com", "Immeuble Aïda 63, VDN"),
    (21, "DIAMA TECHNOLOGY", "33 842 04 44", "contact@diamatech-sn.com", "Av. Lamine Gueye"),
    (22, "CCC COMPAGNY", "77 366 09 09", "contact@ccc.sn", "Im Biénal Home, Rte Aéroport"),
    (23, "FAMI SENEGAL (MINES)", "33 820 26 09", "secretariat@famy.sn", "Im le Ponant, Almadies"),
    (24, "AGS GROUP SARL", "33 871 23 13", "Contact.agsms@gmail.com", "Blvd Maurice Gueye, DDD Rufisque"),
    (25, "SALAM TRANSPORT", "33 825 01 23", "info@salamtransport.com", "Rond Point Sipres"),
    (26, "ICA", "33 869 15 68", "ica@ica-sn.com", "Fann Résidence"),
    (27, "MCI", "33 842 56 92", "Contact.senegal@mci.int.com", "Av. Blaise Diagne, Médina Rue 5"),
    (28, "RENOV INDUSTRY", "33 832 32 46", "info@renovindustries.com", "Zone Industrielle, Dakar Rue 7"),
    (29, "SDV VOYAGE", "33 859 55 77", "", "Av. Hassan II, Dakar"),
    (30, "TTI", "33 832 98 37", "support@tti.com", "Rocade Hann Bel Air, Lot Ne Colobane"),
    (31, "MSC", "33 859 01 01", "", "Rue des Hydrocarbures, Hann Bel Air"),
    (32, "HUMANIS INTERIM", "33 822 86 87", "recrutement@humanis-sn.com", "Sacré Cœur 1, Dakar"),
    (33, "SUNU MINES", "", "", ""),
    (34, "CABINET ABX", "77 164 51 31", "amadou.ba@cabinetabx.sn", "Résidence Adja Coura, Lib 5, Rd Pt JVC"),
    (35, "SANY", "", "", ""),
    (36, "SGS", "33 849 43 43", "sgs.senegal@.com", "Rue Félix Faure, Dakar"),
    (37, "AMSA ASSURANCEE", "33 829 36 00 / 33 839 36 01", "contact-sn@amsaassurances.com", "Av Assan II, Dakar"),
    (38, "OLEA SASSURANCES", "33 864 52 03", "senegal@olea.africa", "Point E, Av Birago Diop"),
    (39, "ICS", "33 879 10 00 / 33 879 14 44", "", "Km 18, Route de Rufisque"),
    (40, "SEN INTERIM", "33 827 63 49", "seninterim@seninterim.sn", "Lot 31, Elton VDN"),
    (41, "IPM FADIOU", "33 824 54 61", "fadiouipm@yahoo.fr", "Sicap Karack Lot 02/B, Ecole Yalla Suuren"),
    (42, "EPHATA", "77 480 99 99 / 77 700 70 00", "ephata@ephata.sn", "Thiés, Rd Pt Concorde Poste Courant"),
    (43, "AFRICA MANAGEMENT", "33 859 28 56", "africmanag@orange.sn", "Ouest Foire, VDN"),
    (44, "IDC", "33 836 93 00", "contact@idc-drilling.com", "Cité Teylium VDN, Sud Foire"),
    (45, "RMO ENERGY", "33 864 09 09", "info@rmo-energyservices.sn", "Viila 52, Cité Batrain"),
    (46, "BOTO SA", "33 820 52 14", "markting@managemgroup.ch", "Quartier Ngor, Almadies 8, Zone 7"),
    (47, "AZUR ENERGY", "", "", ""),
    (48, "NAYE VISION", "", "", ""),
]


def _norm_email(s):
    s = (s or "").strip()
    if not s or "(web)" in s.lower():
        return None
    # Corriger les emails invalides (ex. "sgs.senegal@.com" -> None ou garder)
    if "@" in s and s.count("@") == 1:
        return s
    return None


class Command(BaseCommand):
    help = "Importe la liste des entreprises (EIFFAGE, CRBC, CDE, etc.)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Mettre à jour téléphone, email, adresse des entreprises existantes.",
        )

    def handle(self, *args, **options):
        force = options.get("force", False)
        created = 0
        updated = 0
        skipped = 0
        # SIRET unique par entreprise : on utilise un préfixe + numéro (14 chiffres)
        for num, name, phone, email, address in ENTREPRISES:
            name = (name or "").strip()
            if not name:
                skipped += 1
                continue
            phone = (phone or "").strip() or None
            if phone and len(phone) > 20:
                phone = phone[:20]
            email = _norm_email(email)
            address = (address or "").strip() or "Non renseignée"
            siret = f"1000000{num:07d}"  # 14 chiffres au total
            company, was_created = Company.objects.get_or_create(
                name=name,
                defaults={
                    "siret": siret,
                    "address": address,
                    "phone": phone,
                    "email": email,
                },
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"  Créé : {name}"))
            else:
                if force:
                    company.address = address
                    company.phone = phone
                    if email is not None:
                        company.email = email
                    company.save()
                    updated += 1
                    self.stdout.write(self.style.WARNING(f"  Mis à jour : {name}"))
                else:
                    skipped += 1
        self.stdout.write(
            self.style.SUCCESS(f"\nTerminé : {created} créée(s), {updated} mise(s) à jour, {skipped} ignorée(s).")
        )
