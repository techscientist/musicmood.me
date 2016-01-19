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
        f = open('../tmp/_harmonic.txt','w')
        values = sorted([abs(x) + abs(y) for x, y in zip(y_harmonic, y_percussive)], key=int)
        for result in values:
            f.write(str(int(result*100000000)) + "\n")
        f.close()
        return len(y_harmonic)
    else:
        return y_percussive

print get_harmonic_percussive(sys.argv[1])
