import React, { Component } from 'react';

class Chrono extends Component {
  constructor(props) {
    super(props);
    this.state = {
      minutes: 0,
      seconds: 0,
      previousTransmitter: '',
      flashing: false,
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      if (this.props.transmitter !== '') {
        this.setState((prevState) => {
          const { seconds, minutes } = prevState;
          if (seconds === 59) {
            return {
              minutes: minutes + 1,
              seconds: 0,
            };
          } else {
            return {
              minutes,
              seconds: seconds + 1,
            };
          }
        }, () => {
          const { minutes, seconds } = this.state;
          if (minutes === 3 && seconds === 30) {
            this.startFlashing();
          }
        });
      }
    }, 1000);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.transmitter !== this.props.transmitter) {
      if (this.props.transmitter !== '') {
        if (prevProps.transmitter !== this.state.previousTransmitter) {
          this.setState({
            minutes: 0,
            seconds: 0,
            previousTransmitter: this.props.transmitter,
            flashing: false,
          });
        }
      } else {
        this.setState({
          minutes: 0,
          seconds: 0,
          previousTransmitter: '',
          flashing: false,
        });
      }
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    clearInterval(this.intervalFlashing);
  }

  startFlashing() {
    this.intervalFlashing = setInterval(() => {
      this.setState((prevState) => ({
        flashing: !prevState.flashing
      }));
    }, 246);
  }

  render() {
    const { minutes, seconds, flashing } = this.state;
    if (this.props.transmitter === '') {
      return null;
    }

    const elapsedTime = minutes * 60 + seconds;
    const totalTime = 4 * 60; // 4 minutes
    const progress = (elapsedTime / totalTime) * 100;

    let progressColor;
    if (elapsedTime <= 2 * 60) {
      progressColor = 'lime';
    } else if (elapsedTime <= 3 * 60) {
      progressColor = 'orange';
    } else {
      progressColor = flashing ? 'transparent' : 'red';
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center' , marginTop: '6.8px' }}>
        <div>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        <div style={{ marginLeft: '10.8px', width: '148px', height: '4.8px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.86)', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: progressColor, borderRadius: '6px' }}></div>
        </div>
      </div>
    )
  }
}
export default Chrono