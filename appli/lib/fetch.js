import {format} from 'url'
import http from 'http'
import _fetch from 'isomorphic-fetch'
import { Notif } from './notif';
import config from '../config'

export default function fetch(pathname, options = {}) {
	options.agent = new http.Agent()

	const port = typeof document === 'undefined' ? config.port : document.location.port
	const hostname = typeof document === 'undefined' ? config.hostname : document.location.hostname

	let fetchUrl = pathname;

	if (!(pathname.startsWith('http://') || pathname.startsWith('https://'))) {
		fetchUrl = "http://" + hostname + ":" + port + pathname;
	}

	return _fetch(fetchUrl, options).then(res => {
		if (!res.ok) {
			throw res
		}
		return res
	}).catch(err => {
		if (typeof window !== 'undefined') {
			if (err instanceof Response) {
				Notif.error(`Oops !! Ya une couille dans le potage ..`)
			} else {
				Notif.error(`Oops !! Ya une couille dans le potage ..`)
			}
		}
		throw err
	})
}