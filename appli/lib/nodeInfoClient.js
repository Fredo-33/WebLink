const RADIO_AMATEUR = ['ri49', 'gir', 'rrf', 'tec', 'bav'];

const getters = {
  nodeInfo(name) {
    const direct = this[name] || this[name.replace(/[ ]?[HUV]$/, '')];
    if (direct) return direct;

    const cleaned = name.replace(/[ ]?[HUV]$/, '');
    const match = cleaned.match(/^(\([^\)]+\))\s*(.*)$/);
    const format = s => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    return match ? `${match[1]} ${format(match[2])}` : format(cleaned);
  },

  nodeInfo2(name) {
    const direct = this[name] || this[name.replace(/ [HUV]$/, '')];
    if (direct) return direct;

    const cleaned = name.replace(/ [HUVBRTSA]$/, '');
    const match = cleaned.match(/^(\([^\)]+\))\s*(.*)$/);
    return match ? `${match[1]} ${match[2]}` : cleaned;
  },
};

export const nodeInfoSet = network => (RADIO_AMATEUR.includes(network) ? 'nodeInfo2' : 'nodeInfo');

export function buildNodeInfo(set, data) {
  const trans = { ...((data && data.trans) || {}) };
  Object.defineProperty(trans, 'get', { value: getters[set] || getters.nodeInfo, enumerable: false });
  return {
    nodeInfo: (data && data.nodeInfo) || {},
    trans,
    relais: (data && data.relais) || [],
  };
}

export const emptyNodeInfo = () => buildNodeInfo('nodeInfo', null);

export function loadNodeInfo(network) {
  const set = nodeInfoSet(network);
  return window.fetch(`/api/nodeInfo/${set}`, { cache: 'no-store' })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => buildNodeInfo(set, data));
}
