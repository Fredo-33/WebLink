const SSE = require('./express-sse-evm')
const { parser, fsm } = require('./svxlink')

const sse = new SSE()

	;[
		'ReflectorLogic.MsgNodeList',
		'ReflectorLogic.MsgNodeLeft',
		'ReflectorLogic.MsgNodeJoined',
		'ReflectorLogic.MsgTalkerStart',
		'ReflectorLogic.MsgTalkerStop',
		'weblink.network',

	].forEach(event => {
		parser.on(event, data => {
			sse.send(data || [], event)
		})
	})

module.exports = sse