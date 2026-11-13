# ~/.bashrc: executed by bash(1) for non-login shells.

case $- in
    *i*) ;;
      *) return;;
esac

HISTCONTROL=ignoreboth

shopt -s histappend

HISTSIZE=1000
HISTFILESIZE=2000

shopt -s checkwinsize

if [ -z "${debian_chroot:-}" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

case "$TERM" in
    xterm-color|*-256color) color_prompt=yes;;
esac

force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	color_prompt=yes
    else
	color_prompt=
    fi
fi

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\h:\w\$ '
fi
unset color_prompt force_color_prompt

case "$TERM" in
xterm*|rxvt*)
    PS1="\[\e]0;${debian_chroot:+($debian_chroot)}\u@\h: \w\a\]$PS1"
    ;;
*)
    ;;
esac

if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
fi

export GCC_COLORS='error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01'

alias ll='ls -l'
alias la='ls -A'
alias l='ls -CF'
alias hist='history'

alias rep='cd /opt/weblink'
alias prog='nano /usr/local/sbin/818cli-prog'
alias info='cd /usr/local/sbin/ && ./info.sh'
alias sa818='818cli-prog'
alias fuseau='cd /usr/local/sbin/ && ./fuseau.sh'
alias maj='cd /usr/local/sbin/ && ./updateinterface'

yop() {
  /usr/local/sbin/weblink-nettoyage || return 1
  history -c
  unset HISTFILE
}

rebuildweblink() {
  cd /opt/weblink || return 1
  systemctl start weblink-led@compil
  if make; then
    make restart
  else
    echo "Échec compilation, interface non redémarrée"
  fi
  systemctl start weblink-led@normal
}

function archive() {
  local chemin_appli="/opt/weblink"
  local version_file="$chemin_appli/version.txt"
  local options=(--exclude='.next/cache' --exclude='.git' --exclude='WebLink.*.tar.gz')

  if [ ! -f "$version_file" ]; then
    echo "Fichier version $version_file introuvable"
    return 1
  fi

  local nom=$(sed -n 1p "$version_file" | tr -d '\r')
  local version=$(sed -n 3p "$version_file" | tr -d '[:space:]')

  if ! [[ "$version" =~ ^[A-Za-z0-9._-]+$ ]]; then
    echo "Identifiant absent ou invalide, ligne 3 de $version_file"
    return 1
  fi

  if [ ! -f "$chemin_appli/.next/BUILD_ID" ]; then
    echo "Aucun build dans $chemin_appli/.next, make deploy depuis Mac .."
    return 1
  fi

  if [ "$1" = "modules" ]; then
    make -C "$chemin_appli" deps || return 1
    echo "Archive complète, node_modules inclus"
  else
    options+=(--exclude='./node_modules')
    echo "Archive légère, sans node_modules"
  fi

  local nom_archive="WebLink.$version.tar.gz"

  echo " "
  echo "Version trouvée --> $nom ($version)"
  echo " "
  echo "Création archive ' $nom_archive ' "
  echo " "

  sleep 3

  echo "$version" > "$chemin_appli/.next/PREBUILT"

  tar -czf "$chemin_appli/$nom_archive" "${options[@]}" -C "$chemin_appli" .

  rm -f "$chemin_appli/.next/PREBUILT"

  echo " "
  echo "Création archive terminé !! $(du -h "$chemin_appli/$nom_archive" | cut -f1) - $chemin_appli/$nom_archive"
  echo "Contenu de latestVersion.txt à publier : $version"
  echo " "
}

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi