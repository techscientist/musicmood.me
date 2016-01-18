import serial

numOfStrips = 42   #number of vertical LED strips

serial_matrix = []
serial_matrix.append(0)
serial_matrix = serial_matrix * numOfStrips

mSerial = None
try:
	if inRASPBERRY:
		serdev = '/dev/ttyACM0'
	else:
		serdev = '/dev/tty.usbserial-A400fYHu' #usb -> serial port

	mSerial = serial.Serial(serdev, baudrate = 230400)

mSerial.write(chr(0x6B))
mSerial.write(chr(0x8D))
mSerial.write(chr(0))
mSerial.write(chr(0))
mSerial.write(chr(0))
for x in xrange(0, numOfStrips):
	mSerial.write(chr(serial_matrix[x]))
