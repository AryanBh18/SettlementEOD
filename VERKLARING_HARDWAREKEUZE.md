# Verklaring Hardwarekeuze

**Project:** SettlementEOD (Automated End-of-Day clearing en settlement)  
**Omgeving:** Development op laptop

## Doel van deze verklaring
Deze verklaring beschrijft waarom de gekozen laptopconfiguratie geschikt is voor het ontwikkelen, testen en draaien van de SettlementEOD-applicatie.

## Gekozen hardware en OS

### Laptop: Lenovo ThinkPad E16

| Component | Specificatie |
|---|---|
| Processor | AMD Ryzen 7 7735U |
| RAM | 16 GB |
| Opslag | 512 GB SSD |
| Besturingssysteem | Windows 11 |

## Motivatie per component

### Processor – AMD Ryzen 7 7735U
De Ryzen 7 7735U biedt voldoende multi-core performance om backend-processen (FastAPI), frontend tooling (Vite/TypeScript), database-interacties en test-runs parallel uit te voeren. Dit is belangrijk voor snelle iteraties tijdens development.

### Geheugen – 16 GB RAM
16 GB RAM is passend voor gelijktijdig gebruik van:
- backend server,
- frontend development server,
- databaseverbindingen,
- IDE (bijv. VS Code), browser tabs en testtools.

Hierdoor blijft de werkomgeving stabiel bij dagelijkse ontwikkel- en debugtaken.

### Opslag – 512 GB SSD
Een SSD van 512 GB biedt genoeg ruimte en I/O-snelheid voor:
- broncode en dependencies,
- Python/Node modules,
- lokale build-artifacts en logs,
- tijdelijke testdata en exports.

De SSD-prestaties helpen vooral bij sneller starten van tooling en builds.

### Besturingssysteem – Windows 11
Windows 11 ondersteunt de gebruikte ontwikkeltooling en workflow (Git, Node.js, Python, Docker, editors) en is geschikt als primaire ontwikkelomgeving voor deze applicatie.

## Conclusie
De combinatie **Ryzen 7 7735U + 16 GB RAM + 512 GB SSD + Windows 11** is voldoende en passend voor de SettlementEOD-ontwikkelomgeving. Deze setup ondersteunt betrouwbare development, testen en iteratieve oplevering zonder onnodige performancebeperkingen.
