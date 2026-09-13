#!/bin/sh
# Push local commits, then fast-forward the checkout Caddy serves from.
set -eu
HOST="${DEPLOY_HOST:-swift@100.114.149.99}"
git push
ssh "$HOST" 'git -C /srv/www/brycehart.dev pull --ff-only'
