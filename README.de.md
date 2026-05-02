# FediSuite Plugins

Dieses Repository enthält Plugins für die selbst gehostete FediSuite-App.

Das Ziel ist ganz einfach:

Du betreibst die eigentliche FediSuite-App aus dem Repository `FediSuite`, und dieses Plugin-Repository liegt daneben als `./plugins`.

FediSuite liest die Plugins dann im Container unter `/app/plugins`.

Du musst die App nicht selbst bauen.
Du musst keine Plugin-Dateien manuell in Container kopieren.
Du musst nur:

1. das Self-Hosting-Repository klonen
2. dieses Plugin-Repository nach `./plugins` klonen
3. sicherstellen, dass `./plugins` nach `/app/plugins` gemountet wird
4. FediSuite neu starten

Wenn du kein Entwickler bist, ist das völlig in Ordnung. Diese Anleitung erklärt jeden Schritt.

## Wofür Dieses Repository Da Ist

Für Self-Hoster gibt es zwei verschiedene Repositories:

- `FediSuite`
  Das ist das Haupt-Repository für Self-Hosting mit der `docker-compose.yml`.
- `FediSuite-Plugins`
  Das ist das Plugin-Repository. Es enthält optionale Erweiterungen wie zusätzliche Provider.

Wichtig:

- Lege Plugin-Quellcode nicht manuell in das Haupt-Repository `FediSuite`.
- Kopiere keine Plugin-Dateien in laufende Container.
- Bearbeite nicht das Docker-Image.

Das empfohlene Setup ist immer:

- `FediSuite` klonen
- `FediSuite-Plugins` nach `FediSuite/plugins` klonen
- `./plugins` in die Container mounten

## Was Plugins Können

Plugins können FediSuite um zusätzliche Funktionen erweitern.

Beispiele:

- neue Provider-/Plattform-Integrationen
- zusätzliche UI-Bereiche
- zusätzliche Dashboard-Widgets
- eigene Composer-Erweiterungen

Aktuell enthält dieses Repository:

- `fedisuite-plugin-bluesky`

Dieses Plugin fügt Bluesky-Unterstützung zu FediSuite hinzu.

## Bevor Du Startest

Du solltest bereits ein funktionierendes oder geplantes Self-Hosting-Setup für FediSuite auf Basis dieses Repositories haben:

- <https://github.com/christinloehner/FediSuite>

Außerdem brauchst du:

- Docker
- Docker Compose
- die Berechtigung, Dateien in deinem FediSuite-Ordner zu bearbeiten

Falls du FediSuite noch nicht installiert hast, beginne zuerst mit dem Haupt-Repository für Self-Hosting:

- <https://github.com/christinloehner/FediSuite>

## Empfohlene Ordnerstruktur

Das einfachste Setup sieht auf deinem Server oder Computer so aus:

```text
fedisuite/
  .env
  docker-compose.yml
  plugins/
    .git/
    README.md
    README.de.md
    fedisuite-plugin-bluesky/
      plugin.json
      ...
```

Wichtig ist:

- das Self-Hosting-Repository ist der äußere Ordner
- dieses Plugin-Repository wird darin als `plugins` geklont

## Schritt-für-Schritt-Installation

### 1. Das Haupt-Repository `FediSuite` klonen

Falls du das noch nicht getan hast:

```bash
git clone https://github.com/christinloehner/FediSuite.git
cd FediSuite
```

Falls du deinen FediSuite-Ordner bereits hast, wechsle einfach hinein:

```bash
cd /pfad/zu/deinem/FediSuite
```

### 2. Dieses Plugin-Repository nach `./plugins` klonen

Innerhalb deines `FediSuite`-Ordners führe aus:

```bash
git clone https://github.com/christinloehner/FediSuite-Plugins.git plugins
```

Wichtig:

- der Zielordner sollte genau `plugins` heißen
- dadurch entsteht `./plugins` direkt neben deiner `docker-compose.yml`

Danach sollte dieser Befehl die Plugin-Dateien anzeigen:

```bash
ls -la plugins
```

Du solltest mindestens Folgendes sehen:

- `README.md`
- `LICENSE`
- einen oder mehrere Plugin-Ordner wie `fedisuite-plugin-bluesky`

### 3. Deine `docker-compose.yml` prüfen

Öffne die Datei `docker-compose.yml` im Haupt-Repository `FediSuite`.

Standardmäßig laufen in FediSuite diese Services:

- `db`
- `app`
- `worker1`
- `worker2`

Der Plugin-Ordner muss in diese Services gemountet werden:

- `app`
- jeder Worker-Service, der Plugins kennen soll

Im Standard-Setup aus dem `FediSuite`-Repository bedeutet das normalerweise:

- `app`
- `worker1`
- `worker2`

### 4. Den Plugin-Volume-Mount hinzufügen

Füge in jedem relevanten Service unter `volumes` diese Zeile hinzu:

```yaml
- ./plugins:/app/plugins
```

### 5. Beispiel für die Compose-Konfiguration

Wenn du unsicher bist, wo die Zeile hingehört, findest du hier ein vereinfachtes Beispiel auf Basis des Standard-Setups von FediSuite.

Für `app`:

```yaml
  app:
    image: ${FEDISUITE_IMAGE:-christinloehner/fedisuite:latest}
    env_file:
      - .env
    volumes:
      - uploads_data:/app/uploads
      - ./plugins:/app/plugins
```

Für `worker1`:

```yaml
  worker1:
    image: ${FEDISUITE_IMAGE:-christinloehner/fedisuite:latest}
    env_file:
      - .env
    volumes:
      - uploads_data:/app/uploads
      - ./plugins:/app/plugins
```

Für `worker2`:

```yaml
  worker2:
    image: ${FEDISUITE_IMAGE:-christinloehner/fedisuite:latest}
    env_file:
      - .env
    volumes:
      - uploads_data:/app/uploads
      - ./plugins:/app/plugins
```

Wenn deine `docker-compose.yml` für einen Service bereits einen Abschnitt `volumes:` hat, füge nur die neue Plugin-Zeile unter der vorhandenen Zeile hinzu.

Nicht entfernen:

- `uploads_data:/app/uploads`

Dieses Volume wird weiterhin benötigt.

### 6. Datei speichern

Nachdem du die Plugin-Mount-Zeilen ergänzt hast, speichere die `docker-compose.yml`.

### 7. FediSuite neu starten

Starte jetzt deinen Stack neu, damit die Container den neuen Mount übernehmen:

```bash
docker compose up -d
```

Wenn Docker vorher noch die neueste Image-Version ziehen soll, verwende:

```bash
docker compose pull
docker compose up -d
```

Wenn du die Compose-Datei geändert hast und die Container sicher neu erstellt werden sollen, ist auch das in Ordnung:

```bash
docker compose up -d --force-recreate
```

## Woran Du Erkennst, Dass Es Funktioniert

Nach dem Neustart:

1. öffne FediSuite im Browser
2. melde dich als Admin an
3. öffne den Plugin-Bereich im Admin-Bereich
4. suche nach dem Plugin, das du installiert hast

Wenn dieses Repository aktuell das Bluesky-Plugin enthält, solltest du dort den entsprechenden Plugin-Eintrag sehen.

Je nach Plugin musst du es im Adminbereich eventuell zusätzlich aktivieren.

## Wie Plugin-Updates Funktionieren

Wenn dieses Repository neue Plugins oder Plugin-Updates enthält, wechsle in deinen lokalen `plugins`-Ordner und hole die Änderungen:

```bash
cd plugins
git pull
cd ..
docker compose up -d
```

Das reicht normalerweise aus.

## Wie Du Plugins Entfernst

Wenn du alle Plugins aus deinem Setup entfernen möchtest:

1. entferne oder kommentiere die Zeilen `./plugins:/app/plugins` in deiner `docker-compose.yml`
2. starte die Container neu

Wenn du Plugins grundsätzlich behalten möchtest, aber nur ein bestimmtes Plugin entfernen willst:

1. wechsle nach `./plugins`
2. entferne den betreffenden Plugin-Ordner
3. starte FediSuite neu

Beispiel:

```bash
rm -rf plugins/fedisuite-plugin-bluesky
docker compose up -d
```

Mach das nur, wenn du sicher bist, dass du dieses Plugin wirklich entfernen möchtest.

## Fehlerbehebung

### Das Plugin Taucht in FediSuite Nicht Auf

Prüfe diese Punkte sorgfältig:

1. Wurde dieses Repository wirklich als `./plugins` innerhalb deines `FediSuite`-Ordners geklont?
2. Mountet deine `docker-compose.yml` `./plugins` nach `/app/plugins`?
3. Hast du den Mount bei `app` und den Worker-Services eingetragen?
4. Hast du die Container nach der Änderung der Compose-Datei neu gestartet?
5. Enthält der Plugin-Ordner tatsächlich eine `plugin.json`?

Hilfreiche Befehle:

```bash
ls -la plugins
docker compose ps
docker compose logs app
```

### Ich Habe Den Falschen Ordner Gemountet

Das ist einer der häufigsten Fehler.

Richtig:

```text
FediSuite/
  docker-compose.yml
  plugins/
    fedisuite-plugin-bluesky/
```

Falsch:

```text
FediSuite/
  docker-compose.yml
  FediSuite-Plugins/
```

Wenn dein Ordner `FediSuite-Plugins` statt `plugins` heißt, kannst du entweder:

- ihn in `plugins` umbenennen

oder:

- den Compose-Mount entsprechend anpassen, zum Beispiel:

```yaml
- ./FediSuite-Plugins:/app/plugins
```

Das empfohlene und einfachste Setup bleibt aber:

```yaml
- ./plugins:/app/plugins
```

### Das Plugin-Repo Wurde An Einen Anderen Ort Geklont

Auch das kann funktionieren, aber dann muss deine Compose-Datei auf den echten Pfad zeigen.

Beispiel:

```yaml
- /home/deinname/FediSuite-Plugins:/app/plugins
```

Das ist gültig, aber weniger portabel und meistens weniger bequem, als das Plugin-Repository direkt im Hauptordner von FediSuite zu halten.

Für die meisten Self-Hoster ist `./plugins:/app/plugins` die beste Lösung.

### Ich Habe Dateien Geändert, Aber Es Passiert Nichts

Plugins werden beim Start der Container geladen.

Nach:

- dem Hinzufügen von Plugins
- dem Entfernen von Plugins
- dem Aktualisieren von Plugins
- dem Ändern des Mount-Pfads

solltest du FediSuite deshalb neu starten:

```bash
docker compose up -d
```

### Ich Möchte Die Compose-Datei Vor Dem Neustart Prüfen

Du kannst deine Compose-Konfiguration mit diesem Befehl prüfen:

```bash
docker compose config
```

Wenn Docker Compose einen Fehler meldet, behebe ihn zuerst, bevor du den Stack neu startest.

## Häufige Fragen

### Muss Ich Für Plugins Ein Eigenes Docker-Image Bauen?

Nein.

Genau darum geht es bei diesem Setup: Die Plugins werden vom Host in die laufenden FediSuite-Container gemountet.

### Muss Ich Plugin-Dateien Manuell Nach `/app/plugins` Kopieren?

Nein.

Das übernimmt Docker automatisch über den Volume-Mount.

### Brauche Ich Einen Separaten Plugin-Container?

Nein.

Die Plugin-Dateien liegen einfach auf deinem Host und werden in die normalen FediSuite-Container gemountet.

### Muss Ich Plugins Auch In Den Datenbank-Container Mounten?

Nein.

Nur die FediSuite-Anwendungscontainer brauchen Zugriff auf den Plugin-Ordner.

### Kann Ich Auch Nur Einen Worker Oder Andere Servicenamen Verwenden?

Ja.

Die wichtige Regel lautet:

- jeder FediSuite-Service, der Plugins kennen soll, sollte `/app/plugins` gemountet bekommen

Im Standard-Setup des offiziellen Self-Hosting-Repositories bedeutet das `app`, `worker1` und `worker2`.

## Verwandte Repositories

- Haupt-Repository für Self-Hosting:
  <https://github.com/christinloehner/FediSuite>
- Haupt-Quellcode-Repository:
  <https://github.com/christinloehner/FediSuite-Docker-Image>

## Lizenz

Dieses Repository steht unter der GNU GPL v3.0.
Details findest du in der Datei `LICENSE`.
