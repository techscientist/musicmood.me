import sys
import librosa


def get_tempo(filePath):
    """Return the BMP from a given sound file."""
    y, sr = librosa.load(filePath)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    return tempo


def get_harmonic_percussive(filePath, type='harmonic'):
    """Return the harmonic or the percussive scale of a given sound file. Defaults to harmonic"""
    y, sr = librosa.load(filePath)
    y_harmonic, y_percussive = librosa.effects.hpss(y)

    if type == 'harmonic':
        return y_harmonic
    else:
        return y_percussive

print get_tempo(sys.argv[1])
