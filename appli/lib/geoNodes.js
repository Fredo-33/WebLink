export const DEPARTEMENTS = {"01":{"lat":46.1,"lng":5.3},"02":{"lat":49.5,"lng":3.6},"03":{"lat":46.4,"lng":3.2},"04":{"lat":44.1,"lng":6.2},"05":{"lat":44.7,"lng":6.3},"06":{"lat":43.9,"lng":7.2},"07":{"lat":44.7,"lng":4.4},"08":{"lat":49.6,"lng":4.7},"09":{"lat":42.9,"lng":1.6},"10":{"lat":48.3,"lng":4.1},"11":{"lat":43.1,"lng":2.4},"12":{"lat":44.3,"lng":2.6},"13":{"lat":43.5,"lng":5.4},"14":{"lat":49.1,"lng":-0.3},"15":{"lat":45,"lng":2.6},"16":{"lat":45.7,"lng":0.2},"17":{"lat":45.8,"lng":-0.7},"18":{"lat":47.1,"lng":2.4},"19":{"lat":45.4,"lng":1.9},"2A":{"lat":41.9,"lng":8.7},"2B":{"lat":42.4,"lng":9.2},"21":{"lat":47.4,"lng":4.8},"22":{"lat":48.5,"lng":-2.8},"23":{"lat":46,"lng":1.9},"24":{"lat":45.2,"lng":0.7},"25":{"lat":47.2,"lng":6},"26":{"lat":44.8,"lng":5},"27":{"lat":49.1,"lng":0.9},"28":{"lat":48.4,"lng":1.5},"29":{"lat":48.2,"lng":-4.1},"30":{"lat":43.9,"lng":4.2},"31":{"lat":43.6,"lng":1.4},"32":{"lat":43.7,"lng":0.6},"33":{"lat":44.8,"lng":-0.5},"34":{"lat":43.6,"lng":3.9},"35":{"lat":48.1,"lng":-1.7},"36":{"lat":46.8,"lng":1.6},"37":{"lat":47.3,"lng":0.7},"38":{"lat":45.2,"lng":5.7},"39":{"lat":46.7,"lng":5.6},"40":{"lat":43.9,"lng":-0.5},"41":{"lat":47.6,"lng":1.3},"42":{"lat":45.4,"lng":4.2},"43":{"lat":45.1,"lng":3.8},"44":{"lat":47.2,"lng":-1.6},"45":{"lat":47.9,"lng":2.2},"46":{"lat":44.6,"lng":1.6},"47":{"lat":44.4,"lng":0.5},"48":{"lat":44.5,"lng":3.5},"49":{"lat":47.5,"lng":-0.6},"50":{"lat":49.1,"lng":-1.3},"51":{"lat":49,"lng":4.3},"52":{"lat":48.1,"lng":5.1},"53":{"lat":48.3,"lng":-0.8},"54":{"lat":48.7,"lng":6.2},"55":{"lat":49,"lng":5.4},"56":{"lat":47.8,"lng":-2.8},"57":{"lat":49.1,"lng":6.2},"58":{"lat":47,"lng":3.5},"59":{"lat":50.6,"lng":3.1},"60":{"lat":49.4,"lng":2.1},"61":{"lat":48.6,"lng":0.1},"62":{"lat":50.5,"lng":2.5},"63":{"lat":45.8,"lng":3.1},"64":{"lat":43.3,"lng":-0.4},"65":{"lat":43.2,"lng":0.1},"66":{"lat":42.6,"lng":2.5},"67":{"lat":48.6,"lng":7.6},"68":{"lat":47.9,"lng":7.3},"69":{"lat":45.8,"lng":4.8},"70":{"lat":47.6,"lng":6.2},"71":{"lat":46.6,"lng":4.5},"72":{"lat":48,"lng":0.2},"73":{"lat":45.6,"lng":6.3},"74":{"lat":46,"lng":6.4},"75":{"lat":48.85,"lng":2.35},"76":{"lat":49.5,"lng":1},"77":{"lat":48.6,"lng":2.9},"78":{"lat":48.8,"lng":2.1},"79":{"lat":46.6,"lng":-0.2},"80":{"lat":49.9,"lng":2.3},"81":{"lat":43.9,"lng":2.1},"82":{"lat":44,"lng":1.3},"83":{"lat":43.3,"lng":6.1},"84":{"lat":44,"lng":5.2},"85":{"lat":46.7,"lng":-1.4},"86":{"lat":46.6,"lng":0.3},"87":{"lat":45.8,"lng":1.2},"88":{"lat":48.2,"lng":6.4},"89":{"lat":47.8,"lng":3.6},"90":{"lat":47.6,"lng":6.9},"91":{"lat":48.5,"lng":2.2},"92":{"lat":48.9,"lng":2.2},"93":{"lat":48.9,"lng":2.4},"94":{"lat":48.8,"lng":2.5},"95":{"lat":49,"lng":2.1},"971":{"lat":16.2,"lng":-61.5},"972":{"lat":14.6,"lng":-61},"973":{"lat":4,"lng":-53},"974":{"lat":-21.1,"lng":55.5},"976":{"lat":-12.8,"lng":45.2},"987":{"lat":-17.7,"lng":-149.4}};

export const sanitizeLabel = (str) =>
  String(str)
    .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F300}-\u{1F9FF}]/gu, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function resolveTransmitter(transmitter, mumbleTransmitter, trans) {
  const svx = transmitter === 'MUMBLE' ? null : transmitter;
  const isMumble = !svx && !!mumbleTransmitter;
  const source = svx || mumbleTransmitter;
  if (!source) return null;

  let dept;
  if (isMumble) {
    const m = source.match(/(2[AB]|\d{2,3})\D*$/i);
    if (!m) return null;
    dept = m[1].toUpperCase().padStart(2, '0');
  } else {
    const m = source.match(/\d+/);
    if (!m) return null;
    dept = m[0].padStart(2, '0');
  }

  const coords = DEPARTEMENTS[dept];
  if (!coords) return null;

  const label = !isMumble && trans && typeof trans.get === 'function' ? trans.get(source) : null;
  const rawName = label && label !== '?' ? label : source;

  return { ...coords, dept, name: sanitizeLabel(rawName), isMumble };
}