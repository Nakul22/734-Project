from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from covidsim import Simulation
from DataCleaning import getJson

# configuration
DEBUG = True

# instantiate the app
app = Flask(__name__)
app.config.from_object(__name__)

# enable CORS
CORS(app, resources={r'/*': {'origins': '*'}})

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/ping', methods=['GET'])
def ping_pong():
    return jsonify('pong!')

@app.route('/create_dataset', methods=['GET'])
def trigger_dataset():
    if request.method =='GET':
    # simulation = Simulation()
    # simulation.generateDataset()
    # data = simulation.getInfections()
        return getJson()


if __name__ == '__main__':
    app.run()
