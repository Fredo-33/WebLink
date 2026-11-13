#!/bin/bash

AP_CON="weblink-ap"
ETH=end0
WLAN=wlan0
AP_IF=uap0
CHECK=10
IDLE_LIMIT=30
OFFLINE_LIMIT=60
KNOWN_CHECK=60
BUSY_FLAG=/run/weblink-wifi-busy

eth_ok()  { [ "$(cat /sys/class/net/$ETH/carrier 2>/dev/null)" = "1" ] && ip -4 addr show "$ETH" | grep -q "inet "; }
wifi_ok() { nmcli -t -f DEVICE,STATE dev | grep -q "^$WLAN:connected$"; }
online()  { eth_ok || wifi_ok; }
ap_dev()  { nmcli -t -f NAME,DEVICE con show --active | awk -F: -v c="$AP_CON" '$1==c{print $2}'; }
ap_if_ready() { [ "$(nmcli -g connection.interface-name con show "$AP_CON" 2>/dev/null)" = "$AP_IF" ] && [ -d "/sys/class/net/$AP_IF" ]; }
has_clients() { [ -n "$(iw dev "$1" station dump 2>/dev/null)" ]; }

known_in_range() {
  local scan name ssid
  scan=$(nmcli -t --escape no -f SSID dev wifi list ifname "$WLAN" --rescan auto 2>/dev/null)
  [ -z "$scan" ] && return 1
  while IFS= read -r name; do
    [ "$name" = "$AP_CON" ] && continue
    ssid=$(nmcli -g 802-11-wireless.ssid con show "$name" 2>/dev/null)
    [ -n "$ssid" ] && printf '%s\n' "$scan" | grep -qxF "$ssid" && return 0
  done < <(nmcli -t -f NAME,TYPE con show | awk -F: '$2=="802-11-wireless"{print $1}')
  return 1
}

idle_since=""
offline_since=""
known_checked=0

while true; do
  sleep $CHECK
  now=$SECONDS

  if [ -f "$BUSY_FLAG" ]; then
    idle_since=""; offline_since=""
    continue
  fi

  dev=$(ap_dev)

  if [ -n "$dev" ]; then
    offline_since=""
    if has_clients "$dev"; then
      idle_since=""
      continue
    fi
    if eth_ok || { [ "$dev" != "$WLAN" ] && wifi_ok; }; then
      [ -z "$idle_since" ] && idle_since=$now
      if [ $((now - idle_since)) -ge $IDLE_LIMIT ]; then
        nmcli con down "$AP_CON"
        idle_since=""
      fi
    else
      idle_since=""
      if [ "$dev" != "$WLAN" ] && [ $((now - known_checked)) -ge $KNOWN_CHECK ]; then
        known_checked=$now
        if known_in_range; then
          nmcli con down "$AP_CON"
        fi
      fi
    fi
  else
    idle_since=""
    if online; then
      offline_since=""
    else
      [ -z "$offline_since" ] && offline_since=$now
      if [ $((now - offline_since)) -ge $OFFLINE_LIMIT ] && ap_if_ready; then
        nmcli con up "$AP_CON"
        offline_since=""
      fi
    fi
  fi
done