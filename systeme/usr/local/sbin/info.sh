#!/bin/bash

declare -A CHANNELS=(
    [1]="446.0062"
    [2]="446.0187"
    [3]="446.0312"
    [4]="446.0437"
    [5]="446.0562"
    [6]="446.0687"
    [7]="446.0812"
    [8]="446.0937"
    [9]="446.1062"
    [10]="446.1187"
    [11]="446.1312"
    [12]="446.1437"
    [13]="446.1562"
    [14]="446.1687"
    [15]="446.1812"
    [16]="446.1937"
    [18]="446.2000"
)

declare -A CTCSS_CODES=(
    ["67.0"]="0001"
    ["71.9"]="0002"
    ["74.4"]="0003"
    ["77.0"]="0004"
    ["79.7"]="0005"
    ["82.5"]="0006"
    ["85.4"]="0007"
    ["88.5"]="0008"
    ["91.5"]="0009"
    ["94.8"]="0010"
)

PYTHON_SCRIPT_PATH="/usr/local/sbin/818cli-prog"
DEVICE="/dev/ttyS2"

DEFAULT_CHANNEL="18"
DEFAULT_CTCSS="67.0"
CHANNEL_DISPLAY=""

echo ""
echo " -- Récup des infos pour le Sa818 -- "
echo ""

while true; do
    read -p "Canal ( ${DEFAULT_CHANNEL} ) ou Fréquence ( 446.2000 ) : " CHANNEL_OR_FREQ

    CHANNEL_OR_FREQ=${CHANNEL_OR_FREQ:-$DEFAULT_CHANNEL}

    if [[ "$CHANNEL_OR_FREQ" =~ ^[0-9]+$ ]]; then
        if [[ -v CHANNELS[$CHANNEL_OR_FREQ] ]]; then
            FREQ=${CHANNELS[$CHANNEL_OR_FREQ]}
            CHANNEL_DISPLAY="( ${CHANNEL_OR_FREQ} )"
            break
        else
            echo "Non valide !!"
        fi
    elif [[ "$CHANNEL_OR_FREQ" =~ ^[0-9]{2,3}\.[0-9]{4}$ || "$CHANNEL_OR_FREQ" =~ ^[0-9]{2,3}\.[0-9]{4,5}$ ]]; then
        FREQ=$(printf "%.4f" "$CHANNEL_OR_FREQ")
        CHANNEL_DISPLAY=""
        for key in "${!CHANNELS[@]}"; do
            if [[ "${CHANNELS[$key]}" == "${FREQ}" ]]; then
                CHANNEL_DISPLAY="( ${key} )"
                break
            fi
        done
        break
    else
        echo "Non valide !!"
    fi
done

echo ""

while true; do
    read -p "Ctcss ( ${DEFAULT_CTCSS} ? ) : " CTCSS_INPUT
    CTCSS_FREQ=${CTCSS_INPUT:-$DEFAULT_CTCSS}

    if [[ "$CTCSS_FREQ" =~ ^[0-9]+$ ]]; then
        CTCSS_FREQ="${CTCSS_FREQ}.0"
    fi

    if [[ -v CTCSS_CODES[$CTCSS_FREQ] ]]; then
        CTCSS_CODE=${CTCSS_CODES[$CTCSS_FREQ]}
        break
    else
        echo "Non valide !!"
    fi
done

GROUP="${FREQ},${FREQ},${CTCSS_CODE},2,${CTCSS_CODE}"

echo ""
echo " -- -- -- -- Vérif infos -- -- -- -- "
echo ""
printf "Fréquence : %.4f MHz %s\n" "$FREQ" "$CHANNEL_DISPLAY"
echo "Ctcss : ${CTCSS_FREQ} Hz"
echo ""

read -p "Moué bienne ? Oui / non : " CONFIRMATION
CONFIRMATION=${CONFIRMATION:-O}

if [[ ! "$CONFIRMATION" =~ ^[Oo]$ ]]; then
    echo ""
    echo "Annulation de la programmation .."
    echo ""
    exit 0
fi

python3 "${PYTHON_SCRIPT_PATH}" -g "${GROUP}" -d "${DEVICE}"