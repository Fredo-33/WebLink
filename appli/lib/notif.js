let listeners = [];
let currentState = { message: null, type: 'info' };

const emitChange = () => {
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](currentState);
  }
};

export const Notif = {
  getCurrentState: () => {
    return currentState;
  },

	subscribe: (listener) => {
		listeners.push(listener);
		return () => {
			listeners = listeners.filter(l => l !== listener);
		};
  },

	info: (message) => {
		currentState = { message, type: 'info' };
		emitChange();
	},
   	error: (message) => {
		currentState = { message, type: 'error' };
		emitChange();
	},
	hide: () => {
		currentState = { message: null, type: 'info' };
		emitChange();
	}
};