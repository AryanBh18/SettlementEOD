# GESPREKSVERSLAG

| | |
|---|---|
| **DATUM & TIJD** | 17 april 2026, tijdens werktijd (ca. 45 minuten) |
| **ONDERWERP** | Presentatie en bespreking van de Proof of Concept (PoC) van de Settlement EOD applicatie — Figma UX-prototype als visuele basis voor de te bouwen applicatie |
| **UITGENODIGD** | Aljahn Kromopawiro (Praktijkopleider), Aryan Bhaggoe (Stagiair) |
| **AANWEZIG** | Aljahn Kromopawiro (Praktijkopleider), Aryan Bhaggoe (Stagiair) |

---

## AGENDA

1. Toelichting op de scope, doelstelling en beperkingen van de Proof of Concept (PoC) als Figma UX-prototype
2. Presentatie van de ontworpen schermen en gebruikersstromen in Figma
3. Bespreking van de schermstructuur, navigatie en gebruikerservaring (UX) van de te bouwen applicatie
4. Feedback van de praktijkopleider op het ontwerp en bespreking van verbeterpunten
5. Aanvullende functionaliteitswens: opname van de auditlog-module in het ontwerp en de te bouwen applicatie
6. Vervolgstappen, prioriteiten en planning richting de daadwerkelijke ontwikkeling

---

## AFSPRAKEN & BESLUITEN

1. Het gepresenteerde Figma-prototype is goedgekeurd als geldige Proof of Concept; het ontwerp vormt de visuele en functionele basis voor de daadwerkelijke ontwikkeling van de applicatie
2. Aryan verwerkt de ontvangen feedback in het Figma-ontwerp en neemt de auditlog-module op als scherm en gebruikersstroom in de te bouwen applicatie
3. De auditlog dient per actie minimaal de volgende gegevens te tonen: de ingelogde gebruiker, het tijdstip van de actie, de uitgevoerde handeling, het betrokken object of proces en de uitkomst (succesvol of foutmelding met details)
4. Aryan start na verwerking van de feedback met de daadwerkelijke ontwikkeling van de applicatie, waarbij het goedgekeurde Figma-ontwerp als leidraad dient
5. De wekelijkse voortgangsgesprekken van 15–20 minuten worden op maandag of dinsdag voortgezet; het volgende gesprek vindt plaats in de week van 20 april 2026

---

## VERSLAG

Op 17 april 2026 presenteerde Aryan Bhaggoe een Proof of Concept (PoC) van de Settlement EOD applicatie aan Aljahn Kromopawiro. Het gesprek vond plaats tien dagen na de officiële start van de stage op 7 april. De PoC betrof een interactief schermontwerp gemaakt in Figma, bedoeld als UX-prototype waarmee Aljahn een concreet beeld kon krijgen van wat Aryan zou gaan bouwen. Het doel van dit prototype was niet om werkende code te presenteren, maar om de schermstructuur, gebruikersstromen en functionaliteiten visueel te valideren voordat met de daadwerkelijke ontwikkeling wordt gestart. Het is in de context van softwareontwikkeling gangbaar en nuttig om eerst een UX-prototype op te stellen: zo kunnen ontwerp- en functionaliteitskeuzes vroegtijdig worden bijgestuurd zonder dat al code herschreven hoeft te worden.

Aryan lichtte het Figma-prototype toe aan de hand van een presentatie van de ontworpen schermen. Het prototype toont de volledige navigatiestructuur van de applicatie: van het inlogscherm naar het hoofddashboard, verder naar de EOD-beheerpagina, de transactieoverzichten en de rapportageschermen. Per scherm werden de geplande functionaliteiten en gebruikersacties toegelicht. Aryan legde uit welke keuzes zijn gemaakt in de schermindeling en hoe de gebruikerservaring (UX) is afgestemd op de dagelijkse werkzaamheden van de medewerkers die het systeem zullen gebruiken.

Tijdens de presentatie doorliep Aryan de volgende ontworpen schermen:  het dashboard met een statusoverzicht van de dagelijkse EOD-run, het scherm voor het starten en bewaken van het settlement proces en een rapportagepagina. Aljahn stelde gerichte vragen over de navigatie tussen de schermen en de wijze waarop foutmeldingen zichtbaar worden gemaakt voor de gebruiker. Aryan legde uit dat de foutafhandeling en statusindicatoren in het ontwerp bewust minimalistisch zijn gehouden en in overleg verder kunnen worden uitgewerkt.

Aljahn reageerde positief op het gepresenteerde Figma-prototype. Hij gaf aan dat het ontwerp een duidelijk en herkenbaar beeld geeft van de te bouwen applicatie en goed aansluit op de functionele eisen die tijdens de gesprekken van 7 en 9 april zijn vastgesteld. De schermstructuur, de navigatielogica en de weergave van settlement-statussen werden als logisch en overzichtelijk beoordeeld. Hij merkte op dat het waardevol is om dit visuele referentiepunt te hebben voordat met de ontwikkeling wordt gestart, zodat verwachtingen aan beide kanten goed zijn afgestemd.

Aljahn bracht vervolgens een concrete en onderbouwde verbeterwens naar voren: de toevoeging van een auditlog-module. In het huidige Figma-prototype ontbreekt een scherm of gebruikersstroom die inzicht geeft in welke gebruiker welke actie heeft uitgevoerd en op welk tijdstip. Bij het settlement proces — waarbij financiële gegevens worden verwerkt en bestanden worden gegenereerd — is het essentieel dat alle handelingen traceerbaar zijn. Een auditlog lost dit op door per uitgevoerde operatie de volgende gegevens automatisch vast te leggen: de ingelogde gebruiker, het tijdstip, de uitgevoerde handeling (bijvoorbeeld: EOD gestart, bestand gegenereerd, validatiefout), het betrokken object of proces-ID en de uitkomst inclusief eventuele foutdetails. Dit maakt het mogelijk om bij afwijkingen of klachten achteraf te reconstrueren wat er is gebeurd en door wie. Aljahn benadrukte dat dit niet alleen nuttig is voor het debuggen tijdens de ontwikkelfase, maar ook een vereiste is voor een betrouwbaar settlement systeem in een productieomgeving.

Tot slot werd besproken dat Aryan de ontvangen feedback verwerkt in het Actueel applicatie, waaronder de toevoeging van schermen voor de auditlog-module, en daarna start met de daadwerkelijke ontwikkeling van de applicatie. Het goedgekeurde prototype dient als leidraad voor de bouw. De prioriteiten voor de eerste ontwikkeliteratie zijn: de kernfunctionaliteit van het settlement EOD-proces, de auditlog-module, rolgebaseerde toegangscontrole (RBAC) en de rapportagepagina. Aryan stelt een ontwikkelplanning op en bespreekt deze bij het volgende voortgangsgesprek.


Het gesprek werd constructief afgesloten. Aljahn gaf aan tevreden te zijn met de richting van het project en vertrouwen te hebben in de verdere uitwerking.

---

*Voor Akkoord en Gezien door Praktijk Opleider:*

&nbsp;

&nbsp;

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Aljahn Kromopawiro (Praktijkopleider, BNETS)

---

*Pagina 1/1*
