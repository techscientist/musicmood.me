# Feature extraction example
import numpy as np
import librosa

# Load the example clip
y, sr = librosa.load('../tmp/acdc-back-in-black.mp3')

# Separate harmonics and percussives into two waveforms
y_harmonic, y_percussive = librosa.effects.hpss(y)
for y in y_harmonic:
    print y
for y in y_percussive:
    print y
