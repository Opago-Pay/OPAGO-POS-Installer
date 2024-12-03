async function fetchCurrencies() {
    try {
        const response = await fetch('https://lnbits.opago-pay.com/api/v1/currencies', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const currencies = await response.json();

        const select = document.getElementById('fiatCurrency');

        for (const currency of currencies) {
            const option = document.createElement('option');
            option.value = currency;
            option.text = currency;
            select.appendChild(option);
        }

    } catch (e) {
        console.log("There was an error fetching the currencies: ", e.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const writeConfigButton = document.querySelector('#writeConfig');
    const serialOutput = document.querySelector('#serialOutput');
    const fiatCurrencySelect = document.querySelector('#fiatCurrency');

    fetchCurrencies();
    
    let port; // a global variable to hold the port object
    let reader; // a global variable to hold the reader

    writeConfigButton.addEventListener('click', async () => {
        if ('serial' in navigator) {
            try {
                // check if port is not set or connection is not open
                if (!port || port.readable === null || port.writable === null) {
                    port = await navigator.serial.requestPort();
                    await port.open({ baudRate: 115200 });

                    // assign the reader if it doesn't already exist
                    if (!reader) {
                        reader = port.readable.getReader();
                    }
                }

                const wifiSSID = document.getElementById('wifiSSID').value;
                const wifiPwd = document.getElementById('wifiPwd').value;

                // set data
                const data = {
                    "jsonrpc": "2.0",
                    "id": "1",
                    "method": "setconfig",
                    "params": {
                        "apiKey.key": "imL5noxJcQRVtGWTXqh6an",
                        "apiKey.encoding": "",
                        "callbackUrl": "https://lnbits.opago-pay.com/lnurldevice/api/v1/lnurl/bMyzC",
                        "uriSchemaPrefix": "",
                        "fiatCurrency": document.getElementById('fiatCurrency').value,
                        "fiatPrecision": "2",
                        "locale": "en",
                        "tftRotation": "3",
                        "sleepModeDelay": "30000",
                        "batteryMaxVolts": "4.2",
                        "batteryMinVolts": "2.5",
                        "contrastLevel": "60",
                        "logLevel": "info",
                        "spiffsFormatted": "false",
                        "wifiSSID": wifiSSID,
                        "wifiPwd": wifiPwd,
                    }
                }
                              
                // write data
                const writer = port.writable.getWriter();
                const encoder = new TextEncoder();
                const dataStr = JSON.stringify(data);
                console.log("Sending:", dataStr);  // log data before sending
                const encodedData = encoder.encode(dataStr + "\n"); // add newline character at the end
                await writer.write(encodedData);
                writer.releaseLock();

                // read data
                const decoder = new TextDecoder();

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        reader.releaseLock();
                        break;
                    }
                    // append received data to text area
                    serialOutput.value += decoder.decode(value);
                }

            } catch (err) {
                console.error('There was an error with the serial port:', err);
            }
        } else {
            console.error('Web serial doesn\'t seem to be available here.');
        }
    });
});

