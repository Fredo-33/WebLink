#!/bin/bash

REGION=$(whiptail --title " Configuration Fuseau Horaire " --menu "\nChoisissez votre zone géographique :" 20 60 10 \
"Africa" "" "America" "" "Antarctica" "" "Asia" "" "Atlantic" "" \
"Australia" "" "Europe" "" "Indian" "" "Pacific" "" 3>&1 1>&2 2>&3)

if [ $? = 0 ]; then
    ZONE=$(find /usr/share/zoneinfo/$REGION -maxdepth 1 -type f -not -name "*.tab" -printf "%f\n" | sort | xargs -I {} echo "{} ''" | xargs whiptail --title " Ville / Fuseau " --menu "\nZone choisie : $REGION\nSélectionnez la ville la plus proche :" 20 60 10 3>&1 1>&2 2>&3)

    if [ $? = 0 ]; then
        sudo timedatectl set-timezone "$REGION/$ZONE"
        (
            echo 20 ; sleep 0.4
            sudo systemctl restart chrony
            echo 60 ; sleep 1
            echo 100 ; sleep 0.4
        ) | whiptail --title " Synchro Ntp " --gauge "\nMise à jour de l'heure .." 8 50 0

        HEURE_ACTUELLE=$(date +"%d/%m/%Y %H:%M:%S")
        whiptail --title " Config Terminée " --msgbox "Fuseau sélectionné : $REGION/$ZONE\n\nHeure système : $HEURE_ACTUELLE" 12 50
    fi
fi