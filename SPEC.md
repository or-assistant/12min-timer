# 12MIN.ME Event Timer

## Zweck
Countdown-Timer für 12MIN.ME Events. Wird vor Beginn gestartet und begleitet den Ablauf.

## Ablauf (Sequenz)
3 Runden, jede Runde:
1. Speaker: 12 Minuten
2. Gäste (Q&A): 12 Minuten
3. Pause: 12 Minuten (NUR nach Runde 1 und 2, NICHT nach Runde 3)

Nach dem 3. Speaker + Gäste-Block: offenes Netzwerken. Timer hat seine Aufgabe erfüllt.

Total: 8 Phasen (Speaker 1, Gäste 1, Pause 1, Speaker 2, Gäste 2, Pause 2, Speaker 3, Gäste 3) → "Netzwerken"

## Features
- Grosser Countdown mit Animation (kreisförmig, Uhr-Theme)
- Phasen-Anzeige (Speaker / Gäste / Pause / Netzwerken)
- Runden-Anzeige (1/3, 2/3, 3/3)
- Optional: Standort + Event-Name eingeben
- Auto-Advance Modus (läuft automatisch durch alle Phasen)
- Manual Modus (jede Phase einzeln starten)
- Skip-Button (Phase überspringen)
- Reset-Button
- Sound/Visueller Alert bei letzten 30 Sekunden und bei Phase-Ende

## Design (Marke 12MIN.ME)
- Farben: #FFFFFF (Bg), #F55544 (Rot/Akzent), #333333 (Dark), #EBEBEB (Light Gray)
- Schrift: Rubik (Bold, Semibold, Regular) - lokal gehostet
- Claim: "Don't waste your time!"
- Uhr/Zeit-Identität: kreisförmiger Timer wie eine Uhr
- Schreibweise: 12MIN.ME in Versalien

## Technisch
- Single-page, kein Backend nötig
- Self-contained HTML/CSS/JS
- Rubik font lokal (kein Google CDN)
