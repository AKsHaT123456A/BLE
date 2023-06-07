const noble = require("noble");

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
//these are the specific uuids of the devices we want to interact with.
let pCharacteristic;
noble.on("stateChange", (state) => {
  if (state === "poweredOn") {
    noble.startScanning([SERVICE_UUID], false);
  } else {
    noble.stopScanning();
  }
}); //this event listener executes when the bluetooth adapter is turned on.
//the script starts scanning for devices with the specified service UUID.

noble.on("discover", (peripheral) => {
  if (peripheral.advertisement.serviceUuids.includes(SERVICE_UUID)) {
    console.log("Found ESP32-BLE-Server");
    noble.stopScanning();
    peripheral.connect((error) => {
      if (error) {
        console.error(`Error connecting to peripheral: ${error}`);
        return;
      }
      console.log("Connected to peripheral");
      peripheral.discoverServices([SERVICE_UUID], (error, services) => {
        if (error) {
          console.error(`Error discovering services: ${error}`);
          peripheral.disconnect();
          return;
        } //Once a compatible peripheral is discovered, the script connects to it.
        //Upon successful connection, it discovers the services and characteristics provided by the peripheral.
        const service = services[0];
        service.discoverCharacteristics(
          [CHARACTERISTIC_UUID],
          (error, characteristics) => {
            if (error) {
              console.error(`Error discovering characteristics: ${error}`);
              peripheral.disconnect();
              return;
            }
            const characteristic = characteristics[0];
            pCharacteristic = characteristic;
            console.log(
              "Characteristic defined! Now you can read it in the Client!"
            );
            readCharacteristicValue();
          }
        );
      });
    });
  }
});
function calculateDistance(rssi, power, n) {
  const distance = Math.pow(10, (power - rssi) / (10 * n));
  return distance;
} //this function takes rssi,measured power(in dBm),and the constant n as parameters
//and returns the approximate distance
function readCharacteristicValue(res, req) {
  setInterval(() => {
    if (pCharacteristic) {
      pCharacteristic.read((error, data) => {
        if (error) {
          console.error(`Error reading characteristic: ${error}`);
          return;
        }
        const rssi = pCharacteristic.rssi;
        const distance = calculateDistance(rssi);
        return res
          .status(200)
          .json({ message: { rssi: rssi }, distance: distance });
      });//sending response in metres to the frontend to display
    }
  }, 2000);
}
