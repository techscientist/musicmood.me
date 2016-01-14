import sys
import librosa

filePath = sys.argv[1]

y, sr = librosa.load(filePath)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
print tempo
