const noble = require('noble');

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

let pCharacteristic;

noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning([SERVICE_UUID], false);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  if (peripheral.advertisement.serviceUuids.includes(SERVICE_UUID)) {
    console.log('Found ESP32-BLE-Server');
    noble.stopScanning();
    peripheral.connect((error) => {
      if (error) {
        console.error(`Error connecting to peripheral: ${error}`);
        return;
      }
      console.log('Connected to peripheral');
      peripheral.discoverServices([SERVICE_UUID], (error, services) => {
        if (error) {
          console.error(`Error discovering services: ${error}`);
          peripheral.disconnect();
          return;
        }
        const service = services[0];
        service.discoverCharacteristics([CHARACTERISTIC_UUID], (error, characteristics) => {
          if (error) {
            console.error(`Error discovering characteristics: ${error}`);
            peripheral.disconnect();
            return;
          }
          const characteristic = characteristics[0];
          pCharacteristic = characteristic;
          console.log('Characteristic defined! Now you can read it in the Client!');
          readCharacteristicValue();
        });
      });
    });
  }
});

function readCharacteristicValue() {
  setInterval(() => {
    if (pCharacteristic) {
      pCharacteristic.read((error, data) => {
        if (error) {
          console.error(`Error reading characteristic: ${error}`);
          return;
        }
        const value = data.toString('utf8');
        console.log(`The new characteristic value is: ${value}`);
      });
    }
  }, 2000);
}
