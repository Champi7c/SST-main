import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst.settings')

import django
django.setup()

from companies.models import Company

companies = [
    {"name": "AB CONSTRUCTION", "siret": "10000000000009", "address": "Fann, Av. Cheikh Anta Diop", "phone": "33 864 70 49", "email": "abconstruction@orange.sn"},
    {"name": "AFRICA MANAGEMENT", "siret": "10000000000043", "address": "Ouest Foire, VDN", "phone": "33 859 28 56", "email": "africmanag@orange.sn"},
    {"name": "AGEROUTE", "siret": "10000000000012", "address": "Fann Résidence", "phone": "33 869 07 51", "email": "ageroute@ageroute.sn"},
    {"name": "AGS GROUP SARL", "siret": "10000000000024", "address": "Blvd Maurice Gueye, DDD Rufisque", "phone": "33 871 23 13", "email": "Contact.agsms@gmail.com"},
    {"name": "AMSA ASSURANCEE", "siret": "10000000000037", "address": "Av Assan II, Dakar", "phone": "33 829 36 00", "email": "contact-sn@amsaassurances.com"},
    {"name": "AREZKI", "siret": "10000000000013", "address": "Ngor Almadies, Lot 6", "phone": "33 869 90 99", "email": ""},
    {"name": "AZUR ENERGY", "siret": "10000000000047", "address": "", "phone": "", "email": ""},
    {"name": "BOTO SA", "siret": "10000000000046", "address": "Quartier Ngor, Almadies 8, Zone 7", "phone": "33 820 52 14", "email": "markting@managemgroup.ch"},
    {"name": "CABINET ABX", "siret": "10000000000034", "address": "Résidence Adja Coura, Lib 5, Rd Pt JVC", "phone": "77 164 51 31", "email": "amadou.ba@cabinetabx.sn"},
    {"name": "CARITAS", "siret": "10000000000011", "address": "Av. Cheikh Anta Diop, Dakar", "phone": "33 822 37 60", "email": "secretariatnational@caritassenegal.org"},
    {"name": "CCC COMPAGNY", "siret": "10000000000018", "address": "Immeuble Bienal Home, Rte Aéroport, Virage", "phone": "77 366 09 09", "email": "contact@ccc.sn"},
    {"name": "CDE", "siret": "10000000000003", "address": "Av. F. Eboué / Boulevard Maritime", "phone": "33 839 59 59", "email": "cde@cde.sn"},
    {"name": "CEREEQ", "siret": "10000000000016", "address": "ROUTE FRONT DE TERRE, HANN", "phone": "33 831 00 04", "email": "cereeq@orange.sn"},
    {"name": "COSELEC", "siret": "10000000000010", "address": "Rocade Fann / Bel Air, 13500", "phone": "33 839 02 50", "email": ""},
    {"name": "CRBC", "siret": "10000000000002", "address": "Immeuble Arezki, Almadies", "phone": "33 869 99 88", "email": "sen@crb.com"},
    {"name": "DIAMA TECHNOLOGY", "siret": "10000000000017", "address": "Av. Lamine Gueye", "phone": "33 842 04 44", "email": "contact@diamatech-sa.com"},
    {"name": "EIFFAGE", "siret": "10000000000001", "address": "Av. Félix Eboué, Rte des Brasseries", "phone": "33 839 73 39", "email": "Eiffage-senegal@eiffage.com"},
    {"name": "ENIKON", "siret": "10000000000004", "address": "Cité Marine K. Massar, Villa 194", "phone": "77 645 03 34", "email": "Luka.andrijanic@enikon.com"},
    {"name": "EPHATA", "siret": "10000000000042", "address": "Thiès, Rd Pt Concorde Poste Courant", "phone": "77 480 99 99", "email": "ephata@ephata.sn"},
    {"name": "FAMI SENEGAL (MINES)", "siret": "10000000000023", "address": "Im le Ponant, Almadies", "phone": "33 820 26 09", "email": "secretariat@famy.sn"},
    {"name": "FONDASOL", "siret": "10000000000015", "address": "Cité Sonatel, Villa 28", "phone": "33 864 02 64", "email": "senegal@groupefondasol.com"},
    {"name": "GCA GLOBAL CONSTRUCTION AFRIC", "siret": "10000000000007", "address": "Hann Marinas, Cité ISRA 2", "phone": "33 832 52 05", "email": "gcdakar@globalconstructionafrique.com"},
    {"name": "HERTZ", "siret": "10000000000006", "address": "102 Rue Amadou Assane Ndoye", "phone": "33 889 81 81", "email": "hertz@hertz.sn"},
    {"name": "HUMANIS INTERIM", "siret": "10000000000032", "address": "Sacré Cœur 1, Dakar", "phone": "33 822 86 87", "email": "recrutement@humanis-sn.com"},
    {"name": "ICA", "siret": "10000000000026", "address": "Fann Résidence", "phone": "33 869 15 68", "email": "ica@ica-sn.com"},
    {"name": "ICS", "siret": "10000000000039", "address": "Km 18, Route de Rufisque", "phone": "33 879 10 00", "email": ""},
    {"name": "IDC", "siret": "10000000000044", "address": "Cité Teylium VDN, Sud Foire", "phone": "33 836 93 00", "email": "contact@idc-drilling.com"},
    {"name": "IPM FADIOU", "siret": "10000000000041", "address": "Sicap Karack Lot 02/B, Ecole Yalla Suuren", "phone": "33 824 54 61", "email": "fadiouipm@yahoo.fr"},
    {"name": "KOB LOGISTICS SARL", "siret": "10000000000014", "address": "Lot. Djily Mbaye, Parcelle 315", "phone": "77 608 18 63", "email": "obklogistics.sn@outlook.com"},
    {"name": "LOCASEN", "siret": "10000000000020", "address": "Immeuble Aida 63, VDN", "phone": "33 867 86 85", "email": "locasen@grouplocasen.com"},
    {"name": "MCI", "siret": "10000000000027", "address": "Av. Blaise Diagne, Médina Rue 5", "phone": "33 842 56 92", "email": "Contact.senegal@mci.int.com"},
    {"name": "MSC", "siret": "10000000000031", "address": "Rue des Hydrocarbures, Hann Bel Air", "phone": "33 859 01 01", "email": ""},
    {"name": "NAYE VISION", "siret": "10000000000048", "address": "", "phone": "", "email": ""},
    {"name": "OLEA SASSURANCES", "siret": "10000000000038", "address": "Point E, Av Birago Diop", "phone": "33 864 52 03", "email": "senegal@olea.africa"},
    {"name": "RENOV INDUSTRY", "siret": "10000000000028", "address": "Zone Industrielle, Dakar Rue 7", "phone": "33 832 32 46", "email": "info@renovindustries.com"},
    {"name": "RMO ENERGY", "siret": "10000000000045", "address": "Villa 52, Cité Batrain", "phone": "33 864 09 09", "email": "info@rmo-energyservices.sn"},
    {"name": "SALAM TRANSPORT", "siret": "10000000000025", "address": "Rond Point Sipres", "phone": "33 825 01 23", "email": "info@salamtransport.com"},
    {"name": "SANY", "siret": "10000000000035", "address": "", "phone": "", "email": ""},
    {"name": "SDV VOYAGE", "siret": "10000000000029", "address": "Av. Hassan II, Dakar", "phone": "33 859 55 77", "email": ""},
    {"name": "SELOV", "siret": "10000000000019", "address": "Cité Sipres 2 VDN, Villa 102", "phone": "33 827 57 26", "email": "selov@selov.sn"},
    {"name": "SEN INTERIM", "siret": "10000000000040", "address": "Lot 31, Elton VDN", "phone": "33 827 63 49", "email": "seninterim@seninterim.sn"},
    {"name": "SENAC", "siret": "10000000000005", "address": "16 Av. L. Gueye x Rue Monteil", "phone": "33 842 00 84", "email": "contact@senacpeintures.sn"},
    {"name": "SENECAR TOUR", "siret": "10000000000008", "address": "Rte A. L. S. Senghor, Keur Yoff", "phone": "33 859 77 77", "email": "senecar@orange.sn"},
    {"name": "SGS", "siret": "10000000000036", "address": "Rue Félix Faure, Dakar", "phone": "33 849 43 43", "email": ""},
    {"name": "SUNU MINES", "siret": "10000000000033", "address": "", "phone": "", "email": ""},
    {"name": "TTI", "siret": "10000000000030", "address": "Rocade Hann Bel Air, Lot Ne Colobane", "phone": "33 832 98 37", "email": "support@tti.com"},
]

created = 0
for c in companies:
    obj, was_created = Company.objects.get_or_create(
        siret=c["siret"],
        defaults={
            "name": c["name"],
            "address": c["address"],
            "phone": c["phone"],
            "email": c["email"],
            "is_active": True,
        }
    )
    if was_created:
        created += 1
        print(f"✅ {c['name']}")
    else:
        print(f"⏭️  {c['name']} (existe déjà)")

print(f"\n✅ {created} entreprises importées !")
