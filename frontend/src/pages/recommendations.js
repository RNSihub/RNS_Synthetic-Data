// recommendations.js
export const circuitGenerationRecommendations = [
    "Draw a simple series circuit.",
    "Show me a parallel circuit diagram.",
    "Draw a full wave rectifier circuit.",
    "Generate a circuit with a transistor as a switch.",
    "Create a circuit to blink an LED using a 555 timer.",
    "Design a basic low-pass RC filter circuit.",
    "Draw a voltage divider circuit using resistors.",
    "Generate a circuit to charge a capacitor.",
    "Create a circuit to amplify a signal using an op-amp.",
    "Draw a circuit that uses a photodiode to detect light.",
    "Design a circuit to convert AC to DC using a bridge rectifier.",
    "Generate a circuit to measure current using a shunt resistor.",
    "Create a simple inverter circuit using logic gates.",
    "Draw a circuit using an NPN transistor for switching.",
    "Generate a simple battery charging circuit using a diode.",
    "Design an LED dimmer circuit using a potentiometer.",
    "Draw a basic temperature sensor circuit using a thermistor.",
    "Create a circuit with a relay to control a motor.",
    "Generate a simple buzzer circuit using a transistor.",
    "Design a circuit that turns on an LED when it's dark using an LDR."
];


export const getRandomRecommendations = (arr, n) => {
    let result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        const x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
};