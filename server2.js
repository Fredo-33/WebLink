const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const app = express();
const logFilePath = '/tmp/svxlink.log';

app.use(cors());
app.use(express.json());

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const replacements = [

['(01) NIKO', 'Niko - O1'],
['(11) JOSE', 'José - 11'],
['(13) FRS1320', 'Daniel - 13'],
[/\(13\) DANY\/M/g, 'Dany - 13 Mobile'],
[/\(13\) DANY\/C/g, 'Dany - 13 Camion'],
[/\(13\) DANY/g, 'Dany - 13'],
['(17) FREDDY', 'Freddy - 17'],
['(24) MICHEL', 'Michel - 24'],
[/\(27\) YVES\/M/g, 'Yves - 27 Mobile'],
[/\(27\) YVES/g, 'Yves - 27'],
['(31) PHIL', 'Phil - 31'],
[/\(33\) FREDO\/M/g, 'Frédo - 33 Mobile'],
[/\(33\) FREDO/g, 'Frédo - 33'],
['(33) YOP', 'Yop'],
['(33) TEST', 'Hotspot Test'],
['(33) JEANCLAUDE', 'Jean Claude - 33'],
['(33) JEROME', 'Jérome - 33'],
['(33) CEDRIC', 'Cédric - 33'],
['(33) PATRICK', 'Patrick 🎣 - 33'],
['(40) RL4006', 'Marco - 40'],
['(40) MARCO', 'Marco - 40'],
['(64) RL6402', 'Michel - 64'],
['(64) RL6403', 'Daniel - 64'],
['(64) MAX', 'Max - 64'],
['(66) RL6601', 'Gilles - 66'],
['(76) PASCAL', 'Pascal - 76'],
['(76) DANIEL', 'Daniel - 76'],
['(76) MEDHY', 'Medhy - 76'],
['(77) ERIC', 'Eric - 77'],
['(77) LAURENT', 'Laurent - 77'],
['(77) CARLOS', 'Carlos - 77'],
['(78) MICHEL', 'Michel - 78'],
['(78) THIERRY', 'Thierry - 78'],
['(81) ERIC', 'Eric - 81'],
['(81) FRANCIS', 'Francis - 81'],
['(81) BERNARD', 'Bernard - 81'],
['(81) OLIVIER', 'Olivier - 81'],
['(🫒) LOU\'LIV', 'Lou\'Liv 🫒 - 81'],
[/\(81\) PATRICK\/M/g, 'Patrick - 81 Mobile'],
[/\(81\) PATRICK/g, 'Patrick - 81'],
['(81) FRS466', 'Gilles - 81'],
['(81) DAVID', 'David 🚒 - 81'],
['(81) JEANMARIE', 'Jean Marie - 81'],
['(81) SEB', 'Seb - 81'],
['(81) ALAIN', 'Alain - 81'],
['(85) RL09', 'Rl 09 - 85'],
['(91) MOUNIR', 'Mounir - 91'],
['(94) FRANKY', 'Franky - 94'],
['(95) ALEX', 'Alex - 95'],
['(CT) DAVID', 'David - CT'],
['(972) RL9722', 'Keilly - 972'],
['(972) KEILLY', 'Keilly - 972'],
[/\(972\) RL9723\/M/g, 'Thierry - 972 Mobile'],
[/\(972\) RL9723/g, 'Thierry - 972'],
[/\(972\) THIERRY\/M/g, 'Thierry - 972 Mobile'],
[/\(972\) THIERRY/g, 'Thierry - 972'],
['(974) RL07', 'Rl 07 - 974'],
['(974) RL05', 'Raymond - 974'],

['(ZZ) MUMBLE', 'Mumble'],

['(33) ST-MORILLON', '📡 St Morillon - 33'],
['(33) VILLENAVE', '📡 Villenave - 33'],

['(77) TRILPORT', '📡 Trilport - 77'],
['(81) ALBI', '📡 Albi - 81'],
['(81) CASTRES', '📡 Castres - 81'],
['(81) PUYLAURENS', '📡 Puylaurens - 81'],
['(81) TARN', '📡 Tarn - 81'],

['start:', ' On'],
['stop:', 'Off'],
['joined:', '<--'],
['left:', '-->']

];

const applyReplacements = line => {
  let modifiedLine = line;

  for (const [pattern, replacement] of replacements) {
    const regexPattern = (pattern instanceof RegExp) ? pattern : new RegExp(escapeRegExp(pattern), 'g');
    modifiedLine = modifiedLine.replace(regexPattern, replacement);
  }

  const nameRegex = /(\(\d{2,3}\)\s*)([A-Z]+)/g;
  modifiedLine = modifiedLine.replace(nameRegex, (match, prefix, name) => {
    return prefix + prefix + name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  });

  return modifiedLine;
};

async function getFormattedLogs(filterPredicate, cleanAndFormatLine, numberOfLines, uniqueByDate = false) {
  const data = await fs.readFile(logFilePath, 'utf8');
  let lines = data.split('\n');

  lines = lines.filter(filterPredicate);
  let cleanedLines = lines.map(cleanAndFormatLine);

  if (uniqueByDate) {
    const currentYear = new Date().getFullYear();
    const uniqueLogEntries = {};
    cleanedLines.forEach(line => {
      const dateRegex = /(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/;
      const match = line.match(dateRegex);

      if (match) {
        const [, day, month, hour, minute, second] = match;
        const monthInt = parseInt(month, 10);
        const year = monthInt === 12 && new Date().getMonth() === 0 ? currentYear - 1 : currentYear;

        const fullDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
        const key = line.replace(/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+/, '');
        uniqueLogEntries[key] = { line, date: fullDate };
      }
    });
    cleanedLines = Object.values(uniqueLogEntries)
      .sort((a, b) => a.date - b.date)
      .map(entry => entry.line);
  }

  const relevantLines = cleanedLines.slice(-numberOfLines).map(line => line.slice(0, -2));
  const replacedLines = relevantLines.map(applyReplacements);

  return replacedLines
    .reverse()
    .join('\n\n')
    .replace(/^\[|\]$/g, '');
}

function parseLogLineForDuration(line) {
  const regex = /(\d{2}\/\d{2})\s(\d{2}:\d{2}:\d{2})\s:\sReflectorLogic:\sTalker\s(start|stop):\s(.+)/;
  const match = line.match(regex);
  if (match) {
    const [_, date, time, type, talkerId] = match;
    const currentYear = new Date().getFullYear();
    const month = parseInt(date.substring(3, 5), 10);
    const yearToUse = (month === 1 && new Date().getMonth() === 0) ? currentYear - 1 : currentYear;

    const fullDateStr = `${yearToUse}-${date.substring(3, 5)}-${date.substring(0, 2)}T${time}`;
    const timestamp = new Date(fullDateStr).getTime();
    return {
      timestamp: timestamp,
      type: type,
      talkerId: talkerId.trim(),
      originalLine: line
    };
  }
  return null;
}

async function getFormattedLogsWithDuration(numberOfLines = 200, uniqueByDate = true) {
  const data = await fs.readFile(logFilePath, 'utf8');
  const lines = data.split('\n');

  const talkerStarts = {};
  const allTalkSegments = [];

  for (const line of lines) {
    const parsed = parseLogLineForDuration(line);
    if (parsed) {
      const { timestamp, type, talkerId, originalLine } = parsed;

      if (type === 'start') {
        talkerStarts[talkerId] = timestamp;
      } else if (type === 'stop') {
        if (talkerStarts[talkerId]) {
          const startTime = talkerStarts[talkerId];
          const endTime = timestamp;
          const durationMs = endTime - startTime;

          const dateRegex = /(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/;
          const match = originalLine.match(dateRegex);
          let fullDate = null;
          if (match) {
            const [, day, month, hour, minute, second] = match;
            const monthInt = parseInt(month, 10);
            const currentYear = new Date().getFullYear();
            const year = (monthInt === 12 && new Date().getMonth() === 0) ? currentYear - 1 : currentYear;
            fullDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
          }

          allTalkSegments.push({
            talkerId: talkerId,
            startTime: startTime,
            endTime: endTime,
            durationMs: durationMs,
            originalStopLine: originalLine,
            fullDate: fullDate
          });
          delete talkerStarts[talkerId];
        }
      }
    }
  }

  let processedSegments = allTalkSegments;

  if (uniqueByDate) {
    const uniqueLogEntries = {};

    processedSegments.sort((a, b) => b.endTime - a.endTime);

    for (const segment of processedSegments) {
      const cleanedPart = segment.originalStopLine.replace(': ReflectorLogic: Talker stop:', '').trim();
      const key = cleanedPart.replace(/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+/, '');

      if (!uniqueLogEntries[key] || (segment.fullDate && uniqueLogEntries[key].date < segment.fullDate)) {
        uniqueLogEntries[key] = { segment: segment, date: segment.fullDate };
      }
    }
    processedSegments = Object.values(uniqueLogEntries).map(entry => entry.segment);

    processedSegments.sort((a, b) => a.fullDate - b.fullDate);
  } else {
    processedSegments.sort((a, b) => a.fullDate - b.fullDate);
  }

  let formattedLines = [];
  processedSegments.forEach(segment => {
    const cleaned = segment.originalStopLine.replace(': ReflectorLogic: Talker stop:', '').trim();
    let parts = cleaned.split(/\s+/);
    let formattedLineBase = cleaned;

    if (parts.length >= 3) {
      const [date, time, ...rest] = parts;
      let namePart = rest.join(' ');
      if (namePart.match(/[HUV]$/)) {
        namePart = namePart.slice(0, -1).trim();
      }
      formattedLineBase = `${date}  ${time}  ${namePart}`;
    }

    const totalSeconds = Math.round(segment.durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let durationStr;
    if (minutes === 0) {
      durationStr = `${seconds}s`;
    } else {
      durationStr = `${minutes}m ${seconds}s`;
    }

    formattedLines.push(`${formattedLineBase}   ${durationStr}`);
  });

  const relevantLines = formattedLines.slice(-numberOfLines);
  const replacedLines = relevantLines.map(applyReplacements);

  return replacedLines
    .reverse()
    .join('\n\n')
    .replace(/^\[|\]$/g, '');
}

app.get('/api/logsTemps', async (req, res) => {
  try {
    const numberOfLines = req.query.lines ? parseInt(req.query.lines) : 200;
    const uniqueByDate = req.query.uniqueByDate === 'false' ? false : true;

    const formattedResult = await getFormattedLogsWithDuration(numberOfLines, uniqueByDate);
    res.setHeader('Content-Type', 'text/plain');
    res.send(formattedResult);
  } catch (error) {
    console.error('Erreur récupération logs avec durée :', error);
    res.status(500).send('Erreur récupération logs avec durée');
  }
});

app.get('/api/logs2', async (req, res) => {
  const formattedResult = await getFormattedLogs(
    line => line.includes('ReflectorLogic: Talker start:') || line.includes('ReflectorLogic: Talker stop:'),
    line => {
      let cleaned = line.trim().replace(': ReflectorLogic: Talker', '');
      const parts = cleaned.split(/\s+/);
      if (parts.length >= 4) {
        const [date, time, status, ...rest] = parts;
        return `${date}  ${time}  ${status}  ${rest.join(' ')}`;
      }
      return cleaned;
    },
    180
  );
  res.setHeader('Content-Type', 'text/plain');
  res.send(formattedResult);
});

app.get('/api/logs3', async (req, res) => {
  const formattedResult = await getFormattedLogs(
    line => line.includes('ReflectorLogic: Node left:') || line.includes('ReflectorLogic: Node joined:'),
    line => {
      let cleaned = line.trim().replace(': ReflectorLogic: Node', '');
      const parts = cleaned.split(/\s+/);
      if (parts.length >= 4) {
        const [date, time, arrow, ...rest] = parts;
        return `${date}  ${time}  ${arrow}  ${rest.join(' ')}`;
      }
      return cleaned;
    },
    180
  );
  res.setHeader('Content-Type', 'text/plain');
  res.send(formattedResult);
});

app.get('/api/nodes', (req, res) => {
  exec(`curl -s http://pmr.websdrbordeaux.fr:82`, (error, stdout) => {
    if (error) {
      console.error(`Erreur exécution curl pour /api/nodes: ${error}`);
      return res.status(500).json({ error: 'Échec récupération données nœuds' });
    }
    let nbnode = (stdout.match(/<\/button>/g) || []).length - 17;
    if (nbnode < 0) nbnode = 0;
    res.json({ nbnode });
  });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`\n Serveur Ok -> Port : ${PORT}`);
});