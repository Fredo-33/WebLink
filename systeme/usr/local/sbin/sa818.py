import serial
import time
import requests
import signal
import sys

SERIAL_PORT   = '/dev/ttyS2'
BAUD_RATE     = 9600
API_URL       = 'http://localhost/api/sa818'
POLL_INTERVAL = 0.5

session = requests.Session()

def handle_exit(sig, frame):
    sys.exit(0)

signal.signal(signal.SIGINT,  handle_exit)
signal.signal(signal.SIGTERM, handle_exit)

def send_command(ser, cmd, delay=0.5):
    ser.reset_input_buffer()
    ser.write((cmd + '\r\n').encode('ascii'))
    time.sleep(delay)
    raw = ser.read(ser.in_waiting or 256).decode('ascii', errors='ignore').strip()
    return [line.strip() for line in raw.splitlines() if line.strip()]

def read_config(ser):
    data = {
        'firmware': '',
        'freq_tx':  '',
        'freq_rx':  '',
        'bandwidth': '',
        'squelch':  0,
        'ctcss_tx': '0000',
        'ctcss_rx': '0000',
        'status':   'error'
    }

    try:
        send_command(ser, 'AT+DMOCONNECT', 0.5)

        for line in send_command(ser, 'AT+VERSION', 0.4):
            if '+VERSION:' in line:
                data['firmware'] = line.split(':', 1)[1].strip()

        for line in send_command(ser, 'AT+DMOREADGROUP', 0.6):
            if '+DMOREADGROUP' in line:
                try:
                    parts = [p.strip() for p in line.split(':')[-1].split(',')]
                    if len(parts) >= 6:
                        data.update({
                            'status':    'ok',
                            'bandwidth': '12.5K' if parts[0] == '0' else '25K',
                            'freq_tx':   parts[1],
                            'freq_rx':   parts[2],
                            'ctcss_tx':  parts[3],
                            'squelch':   int(parts[4]),
                            'ctcss_rx':  parts[5],
                        })
                except Exception:
                    pass

        for line in send_command(ser, 'AT+DMOSETVOLUME?', 0.4):
            if 'DMOSETVOLUME' in line.upper():
                try:
                    vol = int(line.split(':')[-1].strip())
                    data['volume'] = vol
                except Exception:
                    pass

    except Exception:
        pass

    return data

def open_serial():
    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
            return ser
        except serial.SerialException:
            time.sleep(5)

def main():
    ser = open_serial()
    config = read_config(ser)

    if config['status'] == 'ok':
        try:
            session.post(f'{API_URL}/config', json=config, timeout=2)
        except requests.exceptions.RequestException:
            pass

    squelch_open  = False
    session_start = None

    while True:
        try:
            rssi = None
            for line in send_command(ser, 'AT+RSSI?', 0.2):
                if 'RSSI=' in line:
                    try:
                        rssi = int(line.split('=')[1])
                    except Exception:
                        pass

            if rssi is not None:
                new_squelch = rssi > 55

                if new_squelch and not squelch_open:
                    session_start = time.time()
                elif not new_squelch:
                    session_start = None

                squelch_open = new_squelch
                duration     = int(time.time() - session_start) if session_start else 0

                try:
                    session.post(API_URL, json={
                        'rssi':             rssi,
                        'squelch_open':     squelch_open,
                        'session_duration': duration,
                    }, timeout=0.5)
                except requests.exceptions.RequestException:
                    pass

        except serial.SerialException:
            try: ser.close()
            except: pass
            ser = open_serial()

        time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    main()