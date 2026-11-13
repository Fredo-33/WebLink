'use strict';

const EventEmitter = require('events').EventEmitter;

class SSE extends EventEmitter {

  constructor(initial, options) {
    super();

    if (initial) {
      this.initial = Array.isArray(initial) ? initial : [initial];
    } else {
      this.initial = [];
    }

    if (options) {
      this.options = options;
    } else {
      this.options = { isSerialized: true };
    }

    this.init = this.init.bind(this);
  }

  init(req, res) {
    let id = 0;
    req.socket.setTimeout(0);
    req.socket.setNoDelay(true);
    req.socket.setKeepAlive(true);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    if (req.httpVersion !== '2.0') {
      res.setHeader('Connection', 'keep-alive');
    }
    if (this.options.isCompressed) {
      res.setHeader('Content-Encoding', 'deflate');
    }

    this.setMaxListeners(this.getMaxListeners() + 2);

    const dataListener = data => {
      if (data.id) {
        res.write(`id: ${data.id}\n`);
      } else {
        res.write(`id: ${id}\n`);
        id += 1;
      }
      if (data.event) {
        res.write(`event: ${data.event}\n`);
      }
      res.write(`data: ${JSON.stringify(data.data)}\n\n`);
      if (res.flush) {
        res.flush();
      }
    };

    const serializeListener = data => {
      const serializeSend = data.reduce((all, msg) => {
        all += `id: ${id}\ndata: ${JSON.stringify(msg)}\n\n`;
        id += 1;
        return all;
      }, '');
      res.write(serializeSend);
    };

    this.on('data', dataListener);

    this.on('serialize', serializeListener);

    if (this.initial) {
      if (this.options.isSerialized) {
        this.serialize(this.initial);
      } else if (this.initial.length > 0) {
        this.send(this.initial, this.options.initialEvent || false);
      }
    }

    req.on('close', () => {
      this.removeListener('data', dataListener);
      this.removeListener('serialize', serializeListener);
      this.setMaxListeners(this.getMaxListeners() - 2);
    });
  }

  updateInit(data) {
    this.initial = Array.isArray(data) ? data : [data];
  }

  dropInit() {
    this.initial = [];
  }

  send(data, event, id) {
    this.emit('data', { data, event, id });
  }

  serialize(data) {
    if (Array.isArray(data)) {
      this.emit('serialize', data);
    } else {
      this.send(data);
    }
  }
}

module.exports = SSE;