#!/bin/bash

set -e
cd "$(dirname "$0")/.."
APPLI=$(pwd)
[ -d systeme ] || [ -d maj ] || exit 0
if [ "$(id -u)" != 0 ] || [ ! -f /etc/armbian-release ]; then
  exit 0
fi
RACINE="${RACINE:-}"

lignes() {
  [ -f "$1" ] || return 0
  sed -e 's/#.*//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' "$1" | grep -v '^$' || true
}

if [ -z "$RACINE" ]; then
  manquants=()
  while IFS= read -r p; do
    dpkg -s "$p" >/dev/null 2>&1 || manquants+=("$p")
  done < <(lignes maj/paquets)
  if [ ${#manquants[@]} -gt 0 ]; then
    echo "Installation des paquets : ${manquants[*]}"
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends "${manquants[@]}"
    apt-get clean
  fi
fi

if [ -d systeme ]; then
  echo "Mise à jour des fichiers système .."
  cd systeme
  find . \( -type f -o -type l \) -print0 | while IFS= read -r -d '' f; do
    d="$RACINE/${f#./}"
    mkdir -p "$(dirname "$d")"
    cp -a "$f" "$d.majtmp"
    mv -f "$d.majtmp" "$d"
    echo " - /${f#./}"
  done
  cd "$APPLI"
fi

while IFS= read -r f; do
  case "$f" in
    /*/*) ;;
    *) echo "Suppression refusée : $f"; continue ;;
  esac
  if [ -e "$RACINE$f" ] || [ -L "$RACINE$f" ]; then
    rm -rf "$RACINE$f"
    echo " - supprimé : $f"
  fi
done < <(lignes maj/supprimer)

if [ -z "$RACINE" ]; then
  systemctl daemon-reload
  while read -r action unite; do
    case "$action" in
      activer) systemctl enable "$unite" >/dev/null 2>&1 || echo "Activation impossible : $unite" ;;
      desactiver) systemctl disable "$unite" >/dev/null 2>&1 || true ;;
      masquer) systemctl mask "$unite" >/dev/null 2>&1 || true ;;
      *) echo "Action inconnue dans maj/services : $action" ;;
    esac
  done < <(lignes maj/services)
fi

if [ -f maj/apres.sh ]; then
  echo "Script apres.sh .."
  RACINE="$RACINE" bash maj/apres.sh
fi

rm -rf "$APPLI/systeme" "$APPLI/maj"
echo "Fichiers système à jour"