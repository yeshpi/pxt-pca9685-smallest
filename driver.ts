/**
 * PCA9685
 */
//% weight=100 color=#0fbc11 icon=""
namespace PCA9685 {
    //const MIN_CHIP_ADDRESS = 0x40
    //const MAX_CHIP_ADDRESS = MIN_CHIP_ADDRESS + 62
    const chipResolution = 4096;
    const PrescaleReg = 0xFE //the prescale register address
    const modeRegister1 = 0x00 // MODE1
    const modeRegister1Default = 0x01
    const modeRegister2 = 0x01 // MODE2
    const modeRegister2Default = 0x04
    const sleep = modeRegister1Default | 0x10; // Set sleep bit to 1
    const wake = modeRegister1Default & 0xEF; // Set sleep bit to 0
    const restart = wake | 0x80; // Set restart bit to 1
    const allChannelsOnStepLowByte = 0xFA // ALL_LED_ON_L
    const allChannelsOnStepHighByte = 0xFB // ALL_LED_ON_H
    const allChannelsOffStepLowByte = 0xFC // ALL_LED_OFF_L
    const allChannelsOffStepHighByte = 0xFD // ALL_LED_OFF_H
    const PinRegDistance = 4
    const channel0OnStepLowByte = 0x06 // LED0_ON_L
    const channel0OnStepHighByte = 0x07 // LED0_ON_H
    const channel0OffStepLowByte = 0x08 // LED0_OFF_L
    const channel0OffStepHighByte = 0x09 // LED0_OFF_H

    export enum PinNum {
        Pin0 = 0,
        Pin1 = 1,
        Pin2 = 2,
        Pin3 = 3,
        Pin4 = 4,
        Pin5 = 5,
        Pin6 = 6,
        Pin7 = 7,
        Pin8 = 8,
        Pin9 = 9,
        Pin10 = 10,
        Pin11 = 11,
        Pin12 = 12,
        Pin13 = 13,
        Pin14 = 14,
        Pin15 = 15,
    }

    export enum ServoNum {
        Servo1 = 1,
        Servo2 = 2,
        Servo3 = 3,
        Servo4 = 4,
        Servo5 = 5,
        Servo6 = 6,
        Servo7 = 7,
        Servo8 = 8,
        Servo9 = 9,
        Servo10 = 10,
        Servo11 = 11,
        Servo12 = 12,
        Servo13 = 13,
        Servo14 = 14,
        Servo15 = 15,
        Servo16 = 16,
    }

    export enum LEDNum {
        LED1 = 1,
        LED2 = 2,
        LED3 = 3,
        LED4 = 4,
        LED5 = 5,
        LED6 = 6,
        LED7 = 7,
        LED8 = 8,
        LED9 = 9,
        LED10 = 10,
        LED11 = 11,
        LED12 = 12,
        LED13 = 13,
        LED14 = 14,
        LED15 = 15,
        LED16 = 16,
    }

    export class ServoConfigObject {
        id: number;
        pinNumber: number;
        minOffset: number;
        midOffset: number;
        maxOffset: number;
        position: number;
    }

    export const DefaultServoConfig = new ServoConfigObject();
    DefaultServoConfig.pinNumber = -1
    DefaultServoConfig.minOffset = 5
    DefaultServoConfig.midOffset = 15
    DefaultServoConfig.maxOffset = 25
    DefaultServoConfig.position = 90

    export class ServoConfig {
        id: number;
        pinNumber: number;
        minOffset: number;
        midOffset: number;
        maxOffset: number;
        position: number;
        constructor(id: number, config: ServoConfigObject) {
            this.id = id
            this.init(config)
        }

        init(config: ServoConfigObject) {
            //this.pinNumber = config.pinNumber > -1 ? config.pinNumber : this.id - 1
            this.pinNumber = config.pinNumber

            this.setOffsetsFromFreq(config.minOffset, config.maxOffset, config.midOffset)
            this.position = -1
        }

        setOffsetsFromFreq(startFreq: number, stopFreq: number, midFreq: number = -1): void {
            this.minOffset = startFreq // calcFreqOffset(startFreq)
            this.maxOffset = stopFreq // calcFreqOffset(stopFreq)

            //this.midOffset = midFreq > -1 ? midFreq : ((stopFreq - startFreq) / 2) + startFreq
            this.midOffset = midFreq
        }
    }

    export class ChipConfig {
        address: number;
        servos: ServoConfig[];
        freq: number;
        constructor(address: number = 0x40, freq: number = 50) {
            this.address = address
            this.servos = [
                new ServoConfig(1, DefaultServoConfig),
                new ServoConfig(2, DefaultServoConfig),
                new ServoConfig(3, DefaultServoConfig),
                new ServoConfig(4, DefaultServoConfig),
                new ServoConfig(5, DefaultServoConfig),
                new ServoConfig(6, DefaultServoConfig),
                new ServoConfig(7, DefaultServoConfig),
                new ServoConfig(8, DefaultServoConfig),
                new ServoConfig(9, DefaultServoConfig),
                new ServoConfig(10, DefaultServoConfig),
                new ServoConfig(11, DefaultServoConfig),
                new ServoConfig(12, DefaultServoConfig),
                new ServoConfig(13, DefaultServoConfig),
                new ServoConfig(14, DefaultServoConfig),
                new ServoConfig(15, DefaultServoConfig),
                new ServoConfig(16, DefaultServoConfig)
            ]
            this.freq = freq
            init(address, freq)
        }
    }

    export const chips: ChipConfig[] = []

    function calcFreqPrescaler(freq: number): number {
        return (25000000 / (freq * chipResolution)) - 1;
    }

    function write(chipAddress: number, register: number, value: number): void {
        const buffer = pins.createBuffer(2)
        buffer[0] = register
        buffer[1] = value
        pins.i2cWriteBuffer(chipAddress, buffer, false)
    }

    export function getChipConfig(address: number): ChipConfig {
        for (let i = 0; i < chips.length; i++) {
            if (chips[i].address === address) {
                return chips[i]
            }
        }
        const chip = new ChipConfig(address)
        const index = chips.length
        chips.push(chip)
        return chips[index]
    }

    function calcFreqOffset(freq: number, offset: number) {
        return ((offset * 1000) / (1000 / freq) * chipResolution) / 10000
    }

    /**
     * Used to set the pulse range (0-4095) of a given pin on the PCA9685
     * @param chipAddress [64-125] The I2C address of your PCA9685; eg: 64
     * @param pinNumber The pin number (0-15) to set the pulse range on
     * @param onStep The range offset (0-4095) to turn the signal on
     * @param offStep The range offset (0-4095) to turn the signal off
     */
    //% block advanced=true
    export function setPinPulseRange(pinNumber: PinNum = 0, onStep: number = 0, offStep: number = 2048, chipAddress: number = 0x40): void {
        //pinNumber = Math.max(0, Math.min(15, pinNumber))
        const buffer = pins.createBuffer(2)
        const pinOffset = PinRegDistance * pinNumber
        onStep = Math.max(0, Math.min(4095, onStep))
        offStep = Math.max(0, Math.min(4095, offStep))

        // Low byte of onStep
        write(chipAddress, pinOffset + channel0OnStepLowByte, onStep & 0xFF)
        // High byte of onStep
        write(chipAddress, pinOffset + channel0OnStepHighByte, (onStep >> 8) & 0x0F)
        // Low byte of offStep
        write(chipAddress, pinOffset + channel0OffStepLowByte, offStep & 0xFF)
        // High byte of offStep
        write(chipAddress, pinOffset + channel0OffStepHighByte, (offStep >> 8) & 0x0F)
    }

    /**
     * Used to set the duty cycle (0-100) of a given led connected to the PCA9685
     * @param chipAddress [64-125] The I2C address of your PCA9685; eg: 64
     * @param ledNumber The number (1-16) of the LED to set the duty cycle on
     * @param dutyCycle The duty cycle (0-100) to set the LED to
     */
    //% block
    export function setLedDutyCycle(ledNum: LEDNum = 1, dutyCycle: number, chipAddress: number = 0x40): void {
        //ledNum = Math.max(1, Math.min(16, ledNum))
        dutyCycle = Math.max(0, Math.min(100, dutyCycle))
        const pwm = (dutyCycle * (chipResolution - 1)) / 100
        return setPinPulseRange(ledNum - 1, 0, pwm, chipAddress)
    }

    function degrees180ToPWM(freq: number, degrees: number, offsetStart: number, offsetEnd: number): number {
        // Calculate the offset of the off point in the freq
        offsetEnd = calcFreqOffset(freq, offsetEnd)
        offsetStart = calcFreqOffset(freq, offsetStart)
        const spread: number = offsetEnd - offsetStart
        const calcOffset: number = ((degrees * spread) / 180) + offsetStart
        // Clamp it to the bounds
        return Math.max(offsetStart, Math.min(offsetEnd, calcOffset))
    }

    /**
     * Used to move the given servo to the specified degrees (0-180) connected to the PCA9685
     * @param chipAddress [64-125] The I2C address of your PCA9685; eg: 64
     * @param servoNum The number (1-16) of the servo to move
     * @param degrees The degrees (0-180) to move the servo to
     */
    //% block
    export function setServoPosition(servoNum: ServoNum = 1, degrees: number, chipAddress: number = 0x40): void {
        const chip = getChipConfig(chipAddress)
        //servoNum = Math.max(1, Math.min(16, servoNum))
        degrees = Math.max(0, Math.min(180, degrees))
        const servo: ServoConfig = chip.servos[servoNum - 1]
        const pwm = degrees180ToPWM(chip.freq, degrees, servo.minOffset, servo.maxOffset)
        servo.position = degrees
        return setPinPulseRange(servo.pinNumber, 0, pwm, chipAddress)
    }

    /**
     * Used to set the range in centiseconds (milliseconds * 10) for the pulse width to control the connected servo
     * @param chipAddress [64-125] The I2C address of your PCA9685; eg: 64
     * @param servoNum The number (1-16) of the servo to move; eg: 1
     * @param minTimeCs The minimum centiseconds (0-1000) to turn the servo on; eg: 5
     * @param maxTimeCs The maximum centiseconds (0-1000) to leave the servo on for; eg: 25
     * @param midTimeCs The mid (90 degree for regular or off position if continuous rotation) for the servo; eg: 15
     */
    //% block advanced=true
    export function setServoLimits(servoNum: ServoNum = 1, minTimeCs: number = 5, maxTimeCs: number = 2.5, midTimeCs: number = -1, chipAddress: number = 0x40): void {
        const chip = getChipConfig(chipAddress)
        //servoNum = Math.max(1, Math.min(16, servoNum))
        minTimeCs = Math.max(0, minTimeCs)
        maxTimeCs = Math.max(0, maxTimeCs)
        const servo: ServoConfig = chip.servos[servoNum - 1]
        midTimeCs = midTimeCs > -1 ? midTimeCs : ((maxTimeCs - minTimeCs) / 2) + minTimeCs
        return servo.setOffsetsFromFreq(minTimeCs, maxTimeCs, midTimeCs)
    }

    /**
     * Used to setup the chip, will cause the chip to do a full reset and turn off all outputs.
     * @param chipAddress [64-125] The I2C address of your PCA9685; eg: 64
     * @param newFreq [40-1000] Frequency (40-1000) in hertz to run the clock cycle at; eg: 50
     */
    //% block advanced=true
    export function init(chipAddress: number = 0x40, newFreq: number = 50) {
        const buf = pins.createBuffer(2)
        const freq = (newFreq > 1000 ? 1000 : (newFreq < 40 ? 40 : newFreq))
        const prescaler = calcFreqPrescaler(freq)

        write(chipAddress, modeRegister1, sleep)
        write(chipAddress, PrescaleReg, prescaler)

        write(chipAddress, allChannelsOnStepLowByte, 0x00)
        write(chipAddress, allChannelsOnStepHighByte, 0x00)
        write(chipAddress, allChannelsOffStepLowByte, 0x00)
        write(chipAddress, allChannelsOffStepHighByte, 0x00)

        write(chipAddress, modeRegister1, wake)
        control.waitMicros(1000)
        write(chipAddress, modeRegister1, restart)
    }

    /**
     * Used to reset the chip, will cause the chip to do a full reset and turn off all outputs.
     * @param chipAddress [64-125] The I2C address of your PCA9685; eg: 64
     */
    //% block
    export function reset(chipAddress: number = 0x40): void {
        return init(chipAddress, getChipConfig(chipAddress).freq);
    }
}
