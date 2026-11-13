#!/bin/bash

GPIO=6
GPIO_DIR="/sys/class/gpio/gpio${GPIO}"
STATUS_LED_TRIGGER="/sys/class/leds/orangepi:red:status/trigger"
STATUS_LED_BRIGHTNESS="/sys/class/leds/orangepi:red:status/brightness"

MODE="$1"

cleanup() {
  echo 0 > "$GPIO_DIR/value"
  [ -f "$STATUS_LED_BRIGHTNESS" ] && echo 0 > "$STATUS_LED_BRIGHTNESS"
  exit 0
}

trap cleanup SIGINT SIGTERM

if [ ! -d "$GPIO_DIR" ]; then
  echo $GPIO > /sys/class/gpio/export
  sleep 0.2
fi
echo out > "$GPIO_DIR/direction"

if [ -f "$STATUS_LED_TRIGGER" ]; then
  echo 'none' > "$STATUS_LED_TRIGGER"
  echo 0 > "$STATUS_LED_BRIGHTNESS"
fi

case "$MODE" in
  perroquet)
    while true; do echo 1 > "$GPIO_DIR/value"; sleep 0.4; echo 0 > "$GPIO_DIR/value"; sleep 0.4; done
    ;;
  maj)
    while true; do echo 1 > "$GPIO_DIR/value"; sleep 0.88; echo 0 > "$GPIO_DIR/value"; sleep 0.88; done
    ;;
  compil)
    while true; do echo 1 > "$GPIO_DIR/value"; sleep 0.1; echo 0 > "$GPIO_DIR/value"; sleep 0.1; done
    ;;
  normal)
    P_ADDR="www.websdrbordeaux.fr"
    while true; do
      if iw dev 2>/dev/null | grep -q "type AP"; then
        for i in 1 2 3 4 5 6; do
          echo 1 > "$GPIO_DIR/value"; sleep 0.04; echo 0 > "$GPIO_DIR/value"; sleep 0.18
        done
        sleep 1.2
        continue
      fi
      ping -c 1 -W 5 $P_ADDR > /dev/null 2>&1
      if [ $? -eq 0 ]; then
        echo 1 > "$GPIO_DIR/value"; sleep 0.04; echo 0 > "$GPIO_DIR/value"; sleep 0.18
        echo 1 > "$GPIO_DIR/value"; sleep 0.04; echo 0 > "$GPIO_DIR/value"; sleep 1.2
      else
        echo 1 > "$GPIO_DIR/value"; sleep 2
      fi
    done
    ;;
  wps)
    while true; do
      echo 1 > "$GPIO_DIR/value"; sleep 0.1; echo 0 > "$GPIO_DIR/value"; sleep 0.16
      echo 1 > "$GPIO_DIR/value"; sleep 0.4; echo 0 > "$GPIO_DIR/value"; sleep 0.4
    done
    ;;
  wpsok)
    for i in $(seq 30); do echo 1 > "$GPIO_DIR/value"; sleep 0.04; echo 0 > "$GPIO_DIR/value"; sleep 0.04; done
    while true; do sleep 1; done
    ;;
  wpserr)
    for i in 1 2 3; do echo 1 > "$GPIO_DIR/value"; sleep 1; echo 0 > "$GPIO_DIR/value"; sleep 0.4; done
    while true; do sleep 1; done
    ;;
  off)
    cleanup
    ;;
  *)
    exit 1
    ;;
esac