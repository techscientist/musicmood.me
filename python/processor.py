import sys
import librosa


y, sr = librosa.load(sys.argv[1])
tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
y_harmonic, y_percussive = librosa.effects.hpss(y)
print '{"bpm": '+str(tempo)+', "harper": [' + (','.join([str(int((abs(x) + abs(y))*1000)) for x, y in zip(y_harmonic, y_percussive)])) + ']}'
