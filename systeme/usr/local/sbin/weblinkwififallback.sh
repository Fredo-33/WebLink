#!/bin/bash

AP_CON="weblink-ap"
AP_SSID="WebLink"
AP_PSK="weblink1234"
AP_ADDR="192.168.42.2/24"
ETH=end0
WLAN=wlan0
AP_IF=uap0
GRACE=10
TIMEOUT=60
SCAN_CACHE=/run/weblink-wifi-scan.txt

if [ ! -d "/sys/class/net/$AP_IF" ]; then
  iw dev "$WLAN" interface add "$AP_IF" type __ap 2>/dev/null
fi
if [ -d "/sys/class/net/$AP_IF" ]; then
  for i in $(seq 1 10); do
    nmcli -t -f DEVICE dev | grep -qx "$AP_IF" && break
    sleep 1
  done
  nmcli dev set "$AP_IF" autoconnect no 2>/dev/null
  AP_DEV="$AP_IF"
else
  AP_DEV="$WLAN"
fi

if ! nmcli -t -f NAME con show | grep -qx "$AP_CON"; then
  nmcli con add type wifi ifname "$AP_DEV" con-name "$AP_CON" autoconnect no \
    ssid "$AP_SSID" \
    802-11-wireless.mode ap 802-11-wireless.band bg 802-11-wireless.channel 6 \
    ipv4.method shared ipv4.addresses "$AP_ADDR" \
    wifi-sec.key-mgmt wpa-psk wifi-sec.psk "$AP_PSK"
  sync
elif [ "$(nmcli -g connection.interface-name con show "$AP_CON")" != "$AP_DEV" ] || \
     [ -n "$(nmcli -g 802-11-wireless.cloned-mac-address con show "$AP_CON")" ]; then
  nmcli con modify "$AP_CON" connection.interface-name "$AP_DEV" \
    802-11-wireless.cloned-mac-address ""
  sync
fi

eth_up()  { [ "$(cat /sys/class/net/$ETH/carrier 2>/dev/null)" = "1" ]; }
eth_ok()  { eth_up && ip -4 addr show "$ETH" | grep -q "inet "; }
wifi_ok() { nmcli -t -f DEVICE,STATE dev | grep -q "^$WLAN:connected$"; }

wait_until() {
  while [ $SECONDS -lt "$1" ]; do
    if eth_ok || wifi_ok; then exit 0; fi
    sleep 1
  done
}

SECONDS=0

wait_until $GRACE

nmcli -t --escape no -f SSID,SIGNAL,SECURITY dev wifi list ifname "$WLAN" --rescan yes > "$SCAN_CACHE" 2>/dev/null

known_in_range=no
while IFS= read -r name; do
  [ "$name" = "$AP_CON" ] && continue
  ssid=$(nmcli -g 802-11-wireless.ssid con show "$name" 2>/dev/null)
  if [ -n "$ssid" ] && cut -d: -f1 "$SCAN_CACHE" | grep -qxF "$ssid"; then
    known_in_range=yes
    break
  fi
done < <(nmcli -t -f NAME,TYPE con show | awk -F: '$2=="802-11-wireless"{print $1}')

if eth_up || [ "$known_in_range" = yes ]; then
  wait_until $TIMEOUT
fi

nmcli con up "$AP_CON"