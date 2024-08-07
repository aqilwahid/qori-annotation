from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)

# C:/Users/aqilw/Ide Jualan Creative/Singularity AI/Dataset Quran-Recitation/Annotation_flask/app.py