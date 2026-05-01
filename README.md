# FediSuite Plugins

This repository contains plugins for the self-hosted FediSuite app.

The goal is simple:

You run the main FediSuite app from the `FediSuite` repository, and you place this plugin repository next to it as `./plugins`.

FediSuite then reads the plugins from inside the container at `/app/plugins`.

You do not need to build the app yourself.
You do not need to copy plugin files into the container by hand.
You only need to:

1. clone the self-hosting repository
2. clone this plugin repository into `./plugins`
3. make sure `./plugins` is mounted to `/app/plugins`
4. restart FediSuite

If you are not a developer, that is completely fine. This guide explains every step.

## What This Repository Is For

There are two different repositories for self-hosters:

- `FediSuite`
  This is the main self-hosting repository with the `docker-compose.yml`.
- `FediSuite-Plugins`
  This is the plugin repository. It contains optional extensions such as additional providers.

Important:

- Do not put plugin source files into the main `FediSuite` repository manually.
- Do not copy plugin files into a running container.
- Do not edit the Docker image.

The recommended setup is always:

- clone `FediSuite`
- clone `FediSuite-Plugins` into `FediSuite/plugins`
- mount `./plugins` into the containers

## What Plugins Can Do

Plugins can extend FediSuite with additional functionality.

Examples:

- new providers/platform integrations
- additional UI sections
- additional dashboard widgets
- custom composer extensions

At the moment, this repository contains:

- `fedisuite-plugin-bluesky`

That plugin adds Bluesky support to FediSuite.

## Before You Start

You should already have a working or planned self-hosted FediSuite setup based on:

- <https://github.com/christinloehner/FediSuite>

You also need:

- Docker
- Docker Compose
- permission to edit files in your FediSuite folder

If you have not installed FediSuite yet, start with the main self-hosting repository first:

- <https://github.com/christinloehner/FediSuite>

## Recommended Folder Structure

The easiest setup looks like this on your server or computer:

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

The important part is:

- the main self-hosting repo is the outer folder
- this plugin repo is cloned inside it as `plugins`

## Step-by-Step Installation

### 1. Clone the Main FediSuite Repository

If you have not done that yet:

```bash
git clone https://github.com/christinloehner/FediSuite.git
cd FediSuite
```

If you already have your FediSuite folder, go into it:

```bash
cd /path/to/your/FediSuite
```

### 2. Clone This Plugin Repository into `./plugins`

Inside your `FediSuite` folder, run:

```bash
git clone https://github.com/christinloehner/FediSuite-Plugins.git plugins
```

Important:

- the target folder name should be exactly `plugins`
- this creates `./plugins` next to your `docker-compose.yml`

After that, this command should show the plugin files:

```bash
ls -la plugins
```

You should see at least:

- `README.md`
- `LICENSE`
- one or more plugin folders such as `fedisuite-plugin-bluesky`

### 3. Check Your `docker-compose.yml`

Open the `docker-compose.yml` file inside the main `FediSuite` repository.

By default, FediSuite runs these services:

- `db`
- `app`
- `worker1`
- `worker2`

The plugin directory must be mounted into:

- `app`
- every worker service that should know about plugins

In the default setup from the `FediSuite` repository, that usually means:

- `app`
- `worker1`
- `worker2`

### 4. Add the Plugin Volume Mount

Inside each relevant service, add this line under `volumes`:

```yaml
- ./plugins:/app/plugins:ro
```

`ro` means read-only.
That is recommended, because FediSuite only needs to read plugin files.

### 5. Example Compose Configuration

If you are unsure where the line should go, here is a simplified example based on the default FediSuite setup.

For `app`:

```yaml
  app:
    image: ${FEDISUITE_IMAGE:-christinloehner/fedisuite:latest}
    env_file:
      - .env
    volumes:
      - uploads_data:/app/uploads
      - ./plugins:/app/plugins:ro
```

For `worker1`:

```yaml
  worker1:
    image: ${FEDISUITE_IMAGE:-christinloehner/fedisuite:latest}
    env_file:
      - .env
    volumes:
      - uploads_data:/app/uploads
      - ./plugins:/app/plugins:ro
```

For `worker2`:

```yaml
  worker2:
    image: ${FEDISUITE_IMAGE:-christinloehner/fedisuite:latest}
    env_file:
      - .env
    volumes:
      - uploads_data:/app/uploads
      - ./plugins:/app/plugins:ro
```

If your `docker-compose.yml` already has a `volumes:` section for a service, only add the new plugin line below the existing one.

Do not remove:

- `uploads_data:/app/uploads`

That volume is still required.

### 6. Save the File

After adding the plugin mount lines, save `docker-compose.yml`.

### 7. Restart FediSuite

Now restart your stack so the containers pick up the new mount:

```bash
docker compose up -d
```

If you also want Docker to pull the latest image update first, use:

```bash
docker compose pull
docker compose up -d
```

If you changed the compose file and want to force recreation, this is also fine:

```bash
docker compose up -d --force-recreate
```

## How to Check If It Works

After the restart:

1. open FediSuite in your browser
2. log in as admin
3. open the plugin area in the admin section
4. look for the plugin you installed

If the repository currently contains the Bluesky plugin, you should see the Bluesky-related plugin entry there.

Depending on the plugin, you may still need to enable it in the admin UI.

## How Plugin Updates Work

When this repository gets new plugins or plugin updates, go into your local `plugins` folder and pull the changes:

```bash
cd plugins
git pull
cd ..
docker compose up -d
```

That is usually enough.

## How to Remove Plugins

If you want to remove all plugins from your setup:

1. remove or comment out the `./plugins:/app/plugins:ro` lines from `docker-compose.yml`
2. restart the containers

If you want to keep plugins enabled in general but remove one specific plugin:

1. go into `./plugins`
2. remove the specific plugin folder
3. restart FediSuite

Example:

```bash
rm -rf plugins/fedisuite-plugin-bluesky
docker compose up -d
```

Only do this if you are sure you want to remove that plugin.

## Troubleshooting

### The Plugin Does Not Appear in FediSuite

Check these points carefully:

1. Is this repository really cloned as `./plugins` inside your `FediSuite` folder?
2. Does your `docker-compose.yml` mount `./plugins` to `/app/plugins`?
3. Did you add the mount to `app` and the worker services?
4. Did you restart the containers after changing the compose file?
5. Does the plugin folder actually contain a `plugin.json`?

Helpful commands:

```bash
ls -la plugins
docker compose ps
docker compose logs app
```

### I Mounted the Wrong Folder

This is one of the most common mistakes.

Correct:

```text
FediSuite/
  docker-compose.yml
  plugins/
    fedisuite-plugin-bluesky/
```

Wrong:

```text
FediSuite/
  docker-compose.yml
  FediSuite-Plugins/
```

If your folder is named `FediSuite-Plugins` instead of `plugins`, either:

- rename it to `plugins`

or:

- change the compose mount accordingly, for example:

```yaml
- ./FediSuite-Plugins:/app/plugins:ro
```

But the recommended and easiest setup is still:

```yaml
- ./plugins:/app/plugins:ro
```

### The Plugin Repo Was Cloned Somewhere Else

That can also work, but then your compose file must point to the real location.

Example:

```yaml
- /home/yourname/FediSuite-Plugins:/app/plugins:ro
```

This is valid, but it is less portable and usually less convenient than keeping the plugin repo directly inside the main FediSuite folder.

For most self-hosters, `./plugins:/app/plugins:ro` is the best option.

### I Changed the Files but Nothing Happens

Plugins are loaded when the containers start.

So after:

- adding plugins
- removing plugins
- updating plugins
- changing the mount path

you should restart FediSuite:

```bash
docker compose up -d
```

### I Want to Check the Compose File Before Restarting

You can validate your compose configuration with:

```bash
docker compose config
```

If Docker Compose shows an error, fix that first before restarting the stack.

## Frequently Asked Questions

### Do I Need to Build a Custom Docker Image for Plugins?

No.

The whole point of this setup is that the plugins are mounted from the host into the running FediSuite containers.

### Do I Need to Copy Plugin Files into `/app/plugins` Manually?

No.

Docker does that automatically through the volume mount.

### Do I Need a Separate Plugin Container?

No.

The plugin files simply live on your host and are mounted into the normal FediSuite containers.

### Do I Need to Mount Plugins into the Database Container?

No.

Only the FediSuite application containers need the plugin directory.

### Can I Use Only One Worker or Different Service Names?

Yes.

The important rule is:

- every FediSuite service that needs plugin awareness should mount `/app/plugins`

In the standard setup from the official self-hosting repository, that means `app`, `worker1`, and `worker2`.

## Related Repositories

- Main self-hosting repository:
  <https://github.com/christinloehner/FediSuite>
- Main source code repository:
  <https://github.com/christinloehner/FediSuite-Docker-Image>

## License

This repository is licensed under the GNU GPL v3.0.
See `LICENSE` for details.
