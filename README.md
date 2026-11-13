# WebLink

WebLink est une distribution prête à l'emploi pour hotspots SvxLink sur Orange Pi Zero, basée sur Armbian.

Elle s'adresse à tout le monde : amateurs de radio en Pmr446 comme radioamateurs licenciés, sur n'importe quel réseau SvxLink.

## Ce qu'elle apporte

- Une interface web complète, accessible depuis n'importe quel appareil du réseau sur **http://weblink.local**
- Une version bureau et une version mobile
- La gestion de plusieurs réseaux et réflecteurs, avec la possibilité d'en ajouter depuis l'interface
- La configuration du module radio Sa818
- La connexion au Wifi par le bouton Wps de la box, en point d'accès ou en Rj45
- Les mises à jour de l'interface et du système directement depuis l'interface, sans refaire de carte
- Une image la plus légère possible, que l'on peut étendre à toute la carte d'un clic

## Installer

Les images prêtes à graver (.zip et .img.xz) se téléchargent sur **https://www.websdrbordeaux.fr**.

Gravez l'image sur une carte microSD (par exemple avec Balena Etcher), démarrez le hotspot, puis ouvrez http://weblink.local.

## Contenu du dépôt

- `appli/` : l'interface web (Next.js), installée dans /opt/weblink sur le hotspot
- `systeme/` : les fichiers système de la distribution (services weblink-*, scripts, configuration SvxLink), à leur place dans l'arborescence du hotspot
- `systeme.liste` : la liste des fichiers système livrés

La météo de l'interface utilise OpenWeatherMap : pour compiler l'interface vous-même, mettez votre propre clé dans `appli/lib/meteo.js`.

## Origine et licence

WebLink est à l'origine basée sur la distribution [Spotnik](http://spotnik.org) de F5NLG Jean-Philippe, et son interface est une version modifiée et étendue de [Spotnik Gui](https://github.com/spotnik-ham/gui) (Sonny Piers et F4GBV Isabelle). Merci aussi à F1EVM Jean-Francois et F4HWN Armel pour les scripts d'origine, et à Tobias pour [SvxLink](https://www.svxlink.org). La liste complète des crédits est dans la page Infos de l'interface.

Comme Spotnik Gui, WebLink est distribuée sous licence Gpl v3 : voir le fichier [LICENSE](LICENSE). Vous pouvez la reprendre et la modifier, à condition de la redistribuer sous la même licence, sources comprises, et d'en citer l'origine.

Le nom WebLink désigne la distribution officielle publiée ici. Une version modifiée doit porter un autre nom.

## Contact

Fredo · https://www.websdrbordeaux.fr
